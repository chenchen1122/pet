# -*- coding: utf-8 -*-
"""
Flask 电子宠物小狗 - 主应用
使用 Session 存储宠物状态，无数据库
"""
import random
from datetime import datetime
from flask import Flask, render_template, request, jsonify, session

app = Flask(__name__)
app.secret_key = 'mydog-secret-key-2026'  # 生产环境应使用环境变量

# 日记条目最大数量，控制 session 大小（默认4KB限制）
MAX_DIARY_ENTRIES = 10
# 成长阶段阈值
GROWTH_STAGES = [0, 50, 100]  # 幼犬, 成犬, 老年犬


def get_default_pet():
    """返回默认宠物状态"""
    return {
        'name': '小比',
        'breed': 'beagle',      # beagle, pomeranian, shiba
        'energy': 80,
        'happiness': 70,
        'cleanliness': 100,
        'growth': 0,
        'accessory': 'none',    # none, hat, scarf, glasses
        'sleeping': False,
        'diary': []
    }


def ensure_pet_session():
    """确保 session 中有宠物数据，若无则初始化"""
    if 'pet' not in session:
        session['pet'] = get_default_pet()
    return session['pet']


def add_diary(pet, event_type, message):
    """添加日记条目，保持最多 MAX_DIARY_ENTRIES 条"""
    entry = {
        'time': datetime.now().strftime('%H:%M'),
        'type': event_type,
        'msg': message
    }
    pet['diary'] = pet.get('diary', [])[-MAX_DIARY_ENTRIES+1:] + [entry]


def clamp(value, min_val=0, max_val=100):
    """限制数值在 [min_val, max_val] 范围内"""
    return max(min_val, min(max_val, value))


@app.route('/')
def index():
    """渲染主页面"""
    pet = ensure_pet_session()
    session.modified = True
    return render_template('index.html', pet=pet)


@app.route('/change_name', methods=['POST'])
def change_name():
    """修改宠物名字"""
    pet = ensure_pet_session()
    new_name = request.json.get('name', '').strip() or '小比'
    pet['name'] = new_name[:20]  # 限制长度
    session.modified = True
    return jsonify({'success': True, 'name': pet['name']})


@app.route('/change_breed', methods=['POST'])
def change_breed():
    """切换宠物形象"""
    pet = ensure_pet_session()
    breed = request.json.get('breed', 'beagle')
    if breed in ('beagle', 'pomeranian', 'shiba'):
        pet['breed'] = breed
    session.modified = True
    return jsonify({'success': True, 'breed': pet['breed']})


@app.route('/change_accessory', methods=['POST'])
def change_accessory():
    """更换配饰"""
    pet = ensure_pet_session()
    acc = request.json.get('accessory', 'none')
    if acc in ('none', 'hat', 'scarf', 'glasses'):
        pet['accessory'] = acc
    session.modified = True
    return jsonify({'success': True, 'accessory': pet['accessory']})


@app.route('/feed', methods=['POST'])
def feed():
    """喂食：体力+10，若体力已满则开心值-5"""
    pet = ensure_pet_session()
    if pet.get('sleeping'):
        return jsonify({'success': False, 'message': '宠物正在睡觉'})

    energy = pet['energy']
    happiness = pet['happiness']
    energy = clamp(energy + 10)
    if energy >= 100:
        happiness = clamp(happiness - 5)
    pet['energy'] = energy
    pet['happiness'] = clamp(happiness)
    pet['growth'] = pet.get('growth', 0) + 2
    add_diary(pet, 'feed', '🍖 喂食啦！')
    session.modified = True
    return jsonify({
        'success': True,
        'energy': pet['energy'],
        'happiness': pet['happiness'],
        'growth': pet['growth'],
        'diary': pet['diary'][-5:]
    })


@app.route('/play', methods=['POST'])
def play():
    """玩耍：开心值+15，体力-5"""
    pet = ensure_pet_session()
    if pet.get('sleeping'):
        return jsonify({'success': False, 'message': '宠物正在睡觉'})

    pet['happiness'] = clamp(pet['happiness'] + 15)
    pet['energy'] = clamp(pet['energy'] - 5)
    pet['growth'] = pet.get('growth', 0) + 3
    add_diary(pet, 'play', '🎾 一起玩耍！')
    session.modified = True
    return jsonify({
        'success': True,
        'energy': pet['energy'],
        'happiness': pet['happiness'],
        'growth': pet['growth'],
        'diary': pet['diary'][-5:]
    })


@app.route('/bathe', methods=['POST'])
def bathe():
    """洗澡：清洁度+20，体力-5，开心值+5"""
    pet = ensure_pet_session()
    if pet.get('sleeping'):
        return jsonify({'success': False, 'message': '宠物正在睡觉'})

    pet['cleanliness'] = clamp(pet['cleanliness'] + 20)
    pet['energy'] = clamp(pet['energy'] - 5)
    pet['happiness'] = clamp(pet['happiness'] + 5)
    pet['growth'] = pet.get('growth', 0) + 1
    add_diary(pet, 'bathe', '🛁 洗香香！')
    session.modified = True
    return jsonify({
        'success': True,
        'energy': pet['energy'],
        'happiness': pet['happiness'],
        'cleanliness': pet['cleanliness'],
        'growth': pet['growth'],
        'diary': pet['diary'][-5:]
    })


@app.route('/sleep', methods=['POST'])
def sleep():
    """睡觉/唤醒：切换睡眠状态"""
    pet = ensure_pet_session()
    action = request.json.get('action', 'toggle')
    if action == 'sleep':
        pet['sleeping'] = True
        add_diary(pet, 'sleep', '😴 进入梦乡...')
    elif action == 'wake':
        pet['sleeping'] = False
        pet['happiness'] = clamp(pet['happiness'] + 5)
        pet['energy'] = 100  # 唤醒时体力回满
        add_diary(pet, 'wake', '☀️ 睡醒啦！')
    else:
        pet['sleeping'] = not pet.get('sleeping', False)
    session.modified = True
    return jsonify({
        'success': True,
        'sleeping': pet['sleeping'],
        'energy': pet['energy'],
        'happiness': pet['happiness'],
        'diary': pet['diary'][-5:]
    })


@app.route('/tick_sleep', methods=['POST'])
def tick_sleep():
    """睡眠期间体力恢复（前端每10秒调用）"""
    pet = ensure_pet_session()
    if pet.get('sleeping'):
        pet['energy'] = clamp(pet['energy'] + 5)
    session.modified = True
    return jsonify({'energy': pet['energy'], 'sleeping': pet['sleeping']})


@app.route('/game_result', methods=['POST'])
def game_result():
    """接球游戏结果"""
    pet = ensure_pet_session()
    success = request.json.get('success', False)
    if success:
        pet['happiness'] = clamp(pet['happiness'] + 15)
        pet['energy'] = clamp(pet['energy'] - 8)
        add_diary(pet, 'game', '🏆 接住飞盘啦！')
    else:
        pet['happiness'] = clamp(pet['happiness'] + 5)
        pet['energy'] = clamp(pet['energy'] - 3)
        add_diary(pet, 'game', '😅 没接住...')
    pet['growth'] = pet.get('growth', 0) + 2
    session.modified = True
    return jsonify({
        'success': True,
        'energy': pet['energy'],
        'happiness': pet['happiness'],
        'growth': pet['growth'],
        'diary': pet['diary'][-5:]
    })


@app.route('/random_event')
def random_event():
    """随机事件（每30秒请求）"""
    pet = ensure_pet_session()
    if pet.get('sleeping'):
        return jsonify({'event': 'none', 'message': ''})

    events = [
        {'type': 'bone', 'msg': '🐕 发现骨头！', 'cleanliness': -5, 'happiness': 5},
        {'type': 'sneeze', 'msg': '🤧 打了个可爱的喷嚏！', 'cleanliness': 0, 'happiness': 0},
        {'type': 'visit', 'msg': '👋 邻居来玩啦！', 'cleanliness': 0, 'happiness': 10},
        {'type': 'sunbath', 'msg': '☀️ 晒太阳好舒服～', 'happiness': 5, 'cleanliness': 0},
        {'type': 'dream', 'msg': '💭 做了美梦！', 'happiness': 3, 'cleanliness': 0},
    ]
    e = random.choice(events)
    if e.get('cleanliness', 0) != 0:
        pet['cleanliness'] = clamp(pet['cleanliness'] + e['cleanliness'])
    if e.get('happiness', 0) != 0:
        pet['happiness'] = clamp(pet['happiness'] + e['happiness'])
    add_diary(pet, 'event', e['msg'])
    session.modified = True
    return jsonify({
        'event': e['type'],
        'message': e['msg'],
        'energy': pet['energy'],
        'happiness': pet['happiness'],
        'cleanliness': pet['cleanliness'],
        'diary': pet['diary'][-5:]
    })


@app.route('/diary')
def diary():
    """返回日记列表"""
    pet = ensure_pet_session()
    return jsonify({'diary': pet.get('diary', [])[-5:]})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
