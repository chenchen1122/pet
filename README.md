# 电子宠物小狗 MyDog

基于 Flask 的网页版电子宠物小狗，使用 Session 存储状态，无需数据库。

## 功能特性

- **宠物形象**：比格犬、博美、柴犬三种可选，Canvas 卡通绘制
- **宠物名字**：可修改，默认「小比」
- **多维状态**：体力、开心值、清洁度（0~100）
- **基础互动**：喂食、玩耍、洗澡、睡觉
- **接球小游戏**：点击扔飞盘，小狗跑去接
- **装扮系统**：帽子、围巾、眼镜三种配饰
- **随机事件**：每 30 秒触发（发现骨头、打喷嚏、邻居来访等）
- **心情日记**：记录最近互动，最多 10 条
- **成长值**：互动增加成长，用于未来扩展

## 环境要求

- Python 3.8+
- Flask

## 安装与运行

```bash
# 进入项目目录
cd mydog

# 安装依赖
pip install -r requirements.txt

# 启动应用
python app.py
```

浏览器访问：http://127.0.0.1:5000

## 项目结构

```
mydog/
├── app.py              # Flask 主应用
├── requirements.txt
├── README.md
├── templates/
│   └── index.html      # 主页面
└── static/
    ├── css/
    │   └── style.css   # 样式表
    ├── js/
    │   ├── main.js     # 宠物绘制、动画、AJAX
    │   └── game.js     # 接球小游戏
    └── images/         # 可放图标等
```

## API 说明

| 路由 | 方法 | 说明 |
|------|------|------|
| `/` | GET | 渲染主页面 |
| `/change_name` | POST | 修改宠物名字 |
| `/change_breed` | POST | 切换形象 |
| `/change_accessory` | POST | 更换配饰 |
| `/feed` | POST | 喂食 |
| `/play` | POST | 玩耍 |
| `/bathe` | POST | 洗澡 |
| `/sleep` | POST | 睡觉/唤醒 |
| `/tick_sleep` | POST | 睡眠期间体力恢复 |
| `/game_result` | POST | 接球游戏结果 |
| `/random_event` | GET | 随机事件 |
| `/diary` | GET | 获取日记 |
