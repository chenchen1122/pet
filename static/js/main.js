/**
 * 电子宠物小狗 - 主逻辑
 * 使用 Canvas 绘制宠物、动画，AJAX 与后端交互
 */
(function () {
    const PET = window.PET_INIT || {
        name: '小比',
        breed: 'beagle',
        energy: 80,
        happiness: 70,
        cleanliness: 100,
        growth: 0,
        accessory: 'none',
        sleeping: false
    };

    const canvas = document.getElementById('pet-canvas');
    const ctx = canvas.getContext('2d');

    let animFrame = 0;
    let blinkTimer = 0;
    let blinkState = false;
    let currentAnim = null;
    let animStartTime = 0;
    let sleepEnergyInterval = null;

    // ---------- 工具函数 ----------
    function updateUI(data) {
        if (data.energy !== undefined) {
            document.getElementById('bar-energy').style.width = data.energy + '%';
            document.getElementById('val-energy').textContent = data.energy;
        }
        if (data.happiness !== undefined) {
            document.getElementById('bar-happiness').style.width = data.happiness + '%';
            document.getElementById('val-happiness').textContent = data.happiness;
        }
        if (data.cleanliness !== undefined) {
            document.getElementById('bar-cleanliness').style.width = data.cleanliness + '%';
            document.getElementById('val-cleanliness').textContent = data.cleanliness;
        }
        if (data.growth !== undefined) {
            const g = document.getElementById('val-growth');
            if (g) g.textContent = data.growth;
        }
        if (data.diary) {
            renderDiary(data.diary);
        }
    }

    function renderDiary(diary) {
        const ul = document.getElementById('diary-list');
        ul.innerHTML = (diary || []).slice().reverse().map(e =>
            `<li class="diary-item"><span class="diary-time">${e.time}</span> ${e.msg}</li>`
        ).join('');
    }

    function setButtonsDisabled(disabled) {
        ['btn-feed', 'btn-play', 'btn-bathe', 'btn-game'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = disabled;
        });
    }

    function showToast(msg) {
        const toast = document.getElementById('event-toast');
        toast.textContent = msg;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2500);
    }

    // ---------- Canvas 绘制 ----------
    function drawDog(breed, sleeping, sad) {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;

        ctx.clearRect(0, 0, w, h);

        // 品种颜色
        const colors = {
            beagle: { body: '#D4A574', ear: '#8B7355', spot: '#3D2914' },
            pomeranian: { body: '#F5DEB3', ear: '#DEB887', spot: null },
            shiba: { body: '#F4A460', ear: '#8B4513', spot: '#D2691E' }
        };
        const c = colors[breed] || colors.beagle;

        // 身体
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 40, 70, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        if (c.spot && breed === 'beagle') {
            ctx.fillStyle = c.spot;
            ctx.beginPath();
            ctx.ellipse(cx - 20, cy + 50, 25, 30, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // 头
        const headSize = breed === 'pomeranian' ? 55 : 48;
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.arc(cx, cy - 50, headSize, 0, Math.PI * 2);
        ctx.fill();

        // 耳朵（不同品种形状不同）
        ctx.fillStyle = c.ear;
        if (breed === 'beagle') {
            ctx.beginPath();
            ctx.ellipse(cx - 45, cy - 80, 18, 35, -0.3, 0, Math.PI * 2);
            ctx.ellipse(cx + 45, cy - 80, 18, 35, 0.3, 0, Math.PI * 2);
            ctx.fill();
        } else if (breed === 'pomeranian') {
            ctx.beginPath();
            ctx.arc(cx - 50, cy - 85, 12, 0, Math.PI * 2);
            ctx.arc(cx + 50, cy - 85, 12, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(cx - 50, cy - 75);
            ctx.lineTo(cx - 30, cy - 95);
            ctx.lineTo(cx - 10, cy - 75);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx + 50, cy - 75);
            ctx.lineTo(cx + 30, cy - 95);
            ctx.lineTo(cx + 10, cy - 75);
            ctx.fill();
        }

        // 眼睛
        const eyeY = sad ? cy - 52 : cy - 55;
        ctx.fillStyle = '#2D1B0E';
        if (blinkState) {
            ctx.beginPath();
            ctx.moveTo(cx - 15, eyeY);
            ctx.lineTo(cx - 5, eyeY);
            ctx.moveTo(cx + 15, eyeY);
            ctx.lineTo(cx + 5, eyeY);
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.arc(cx - 12, eyeY, 4, 0, Math.PI * 2);
            ctx.arc(cx + 12, eyeY, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // 嘴巴
        if (!sleeping && !blinkState) {
            ctx.strokeStyle = '#2D1B0E';
            ctx.lineWidth = 2;
            ctx.beginPath();
            if (sad) {
                ctx.arc(cx, cy - 30, 8, 0.3 * Math.PI, 0.7 * Math.PI);
            } else {
                ctx.arc(cx, cy - 25, 10, 0.2 * Math.PI, 0.8 * Math.PI);
            }
            ctx.stroke();
        }

        // 鼻子
        ctx.fillStyle = '#2D1B0E';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 42, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 尾巴（不同品种）
        ctx.fillStyle = c.ear;
        ctx.save();
        ctx.translate(cx + 75, cy + 20);
        if (breed === 'pomeranian') {
            ctx.rotate(0.5);
            ctx.beginPath();
            ctx.arc(0, 0, 25, 0, Math.PI * 2);
            ctx.fill();
        } else if (breed === 'shiba') {
            ctx.rotate(-0.3);
            ctx.beginPath();
            ctx.ellipse(15, 0, 30, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.rotate(0.2);
            ctx.beginPath();
            ctx.ellipse(20, 0, 25, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // 绘制配饰
    function drawAccessory(acc, breed) {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        if (acc === 'none') return;

        ctx.save();
        if (acc === 'hat') {
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.moveTo(cx - 40, cy - 95);
            ctx.lineTo(cx, cy - 130);
            ctx.lineTo(cx + 40, cy - 95);
            ctx.fill();
            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 95, 45, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else if (acc === 'scarf') {
            ctx.fillStyle = '#E74C3C';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 20, 80, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(cx + 50, cy + 5, 30, 60);
        } else if (acc === 'glasses') {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx - 15, cy - 55, 12, 0, Math.PI * 2);
            ctx.arc(cx + 15, cy - 55, 12, 0, Math.PI * 2);
            ctx.moveTo(cx - 3, cy - 55);
            ctx.lineTo(cx + 3, cy - 55);
            ctx.stroke();
        }
        ctx.restore();
    }

    // 动画覆盖层（骨头、泡泡等）
    function drawAnimOverlay(anim, t) {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        if (!anim) return;

        if (anim === 'bone' && t < 1.2) {
            const y = 150 - t * 80;
            ctx.font = '48px Arial';
            ctx.fillText('🦴', cx - 24, y);
        } else if (anim === 'ball' && t < 1.2) {
            const y = 150 - t * 60;
            ctx.font = '40px Arial';
            ctx.fillText('🎾', cx - 20 + Math.sin(t * 5) * 10, y);
        } else if (anim === 'bubble' && t < 1.5) {
            for (let i = 0; i < 5; i++) {
                const x = cx - 80 + i * 40 + Math.sin(t * 3 + i) * 5;
                const y = cy + 60 - t * 100 - i * 15;
                ctx.font = '24px Arial';
                ctx.fillText('🫧', x, y);
            }
        } else if (anim === 'zzz' && t < 2) {
            ctx.font = '28px Arial';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            const z = 'Z'.repeat(Math.floor(t * 3) + 1);
            ctx.fillText(z, cx - 20, 100 - t * 20);
        }
    }

    // 主渲染循环
    function render() {
        const now = Date.now() / 1000;
        const sad = PET.energy < 30 || PET.happiness < 30;

        // 眨眼
        blinkTimer -= 0.016;
        if (blinkTimer <= 0) {
            blinkState = !blinkState;
            if (blinkState) blinkTimer = 0.15;
            else blinkTimer = 4 + Math.random() * 3;
        }

        // 动画
        let animElapsed = 0;
        if (currentAnim) {
            animElapsed = now - animStartTime;
            if (animElapsed > 2) currentAnim = null;
        }

        drawDog(PET.breed, PET.sleeping, sad);
        drawAccessory(PET.accessory, PET.breed);
        drawAnimOverlay(currentAnim, animElapsed);

        animFrame = requestAnimationFrame(render);
    }

    function playAnim(name) {
        currentAnim = name;
        animStartTime = Date.now() / 1000;
    }

    // ---------- AJAX ----------
    async function api(url, method, body) {
        const opt = { method: method || 'GET', headers: { 'Content-Type': 'application/json' } };
        if (body) opt.body = JSON.stringify(body);
        const res = await fetch(url, opt);
        return res.json();
    }

    async function doFeed() {
        const data = await api('/feed', 'POST', {});
        if (data.success) {
            updateUI(data);
            playAnim('bone');
        } else {
            showToast(data.message || '操作失败');
        }
    }

    async function doPlay() {
        const data = await api('/play', 'POST', {});
        if (data.success) {
            updateUI(data);
            playAnim('ball');
        } else {
            showToast(data.message || '操作失败');
        }
    }

    async function doBathe() {
        const data = await api('/bathe', 'POST', {});
        if (data.success) {
            updateUI(data);
            playAnim('bubble');
        } else {
            showToast(data.message || '操作失败');
        }
    }

    async function doSleep() {
        const btn = document.getElementById('btn-sleep');
        const action = PET.sleeping ? 'wake' : 'sleep';
        const data = await api('/sleep', 'POST', { action });
        if (data.success) {
            PET.sleeping = data.sleeping;
            PET.energy = data.energy;
            PET.happiness = data.happiness;
            updateUI(data);
            setButtonsDisabled(PET.sleeping);
            btn.textContent = PET.sleeping ? '☀️ 唤醒' : '😴 睡觉';
            playAnim(PET.sleeping ? 'zzz' : null);
            if (PET.sleeping) {
                sleepEnergyInterval = setInterval(tickSleep, 10000);
            } else {
                clearInterval(sleepEnergyInterval);
            }
        }
    }

    async function tickSleep() {
        const data = await api('/tick_sleep', 'POST', {});
        PET.energy = data.energy;
        document.getElementById('bar-energy').style.width = data.energy + '%';
        document.getElementById('val-energy').textContent = data.energy;
        if (!data.sleeping) clearInterval(sleepEnergyInterval);
    }

    async function fetchRandomEvent() {
        if (PET.sleeping) return;
        const data = await fetch('/random_event').then(r => r.json());
        if (data.message) {
            showToast(data.message);
            updateUI(data);
        }
    }

    // ---------- 事件绑定 ----------
    function bindEvents() {
        // 改名
        document.getElementById('btn-edit-name').onclick = () => {
            document.getElementById('edit-name-form').classList.remove('hidden');
        };
        document.getElementById('btn-cancel-edit').onclick = () => {
            document.getElementById('edit-name-form').classList.add('hidden');
        };
        document.getElementById('btn-save-name').onclick = async () => {
            const name = document.getElementById('name-input').value.trim() || '小比';
            const data = await api('/change_name', 'POST', { name });
            if (data.success) {
                PET.name = data.name;
                document.getElementById('pet-name').textContent = data.name;
                document.getElementById('edit-name-form').classList.add('hidden');
            }
        };

        // 形象切换
        document.getElementById('breed-select').onchange = async (e) => {
            const breed = e.target.value;
            const data = await api('/change_breed', 'POST', { breed });
            if (data.success) PET.breed = data.breed;
        };

        // 配饰
        document.querySelectorAll('.acc-btn').forEach(btn => {
            btn.onclick = async () => {
                document.querySelectorAll('.acc-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const acc = btn.dataset.acc;
                const data = await api('/change_accessory', 'POST', { accessory: acc });
                if (data.success) PET.accessory = data.accessory;
            };
        });

        // 同步 active 状态
        document.querySelector(`.acc-btn[data-acc="${PET.accessory}"]`)?.classList.add('active');
        document.querySelectorAll('.acc-btn').forEach(b => {
            if (b.dataset.acc === PET.accessory) b.classList.add('active');
            else b.classList.remove('active');
        });

        // 操作按钮
        document.getElementById('btn-feed').onclick = doFeed;
        document.getElementById('btn-play').onclick = doPlay;
        document.getElementById('btn-bathe').onclick = doBathe;
        document.getElementById('btn-sleep').onclick = doSleep;
        document.getElementById('btn-game').onclick = () => {
            if (window.openCatchGame) window.openCatchGame();
        };

        setButtonsDisabled(PET.sleeping);
        document.getElementById('btn-sleep').textContent = PET.sleeping ? '☀️ 唤醒' : '😴 睡觉';
    }

    // ---------- 初始化 ----------
    function init() {
        renderDiary(PET.diary || []);
        if (document.getElementById('val-growth')) {
            document.getElementById('val-growth').textContent = PET.growth;
        }
        bindEvents();
        render();

        // 每 30 秒随机事件
        setInterval(fetchRandomEvent, 30000);
    }

    init();

    // 暴露给 game.js
    window.updatePetFromGame = function (data) {
        Object.assign(PET, data);
        updateUI(data);
        const g = document.getElementById('val-growth');
        if (g && data.growth !== undefined) g.textContent = data.growth;
    };
})();
