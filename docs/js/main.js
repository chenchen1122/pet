/**
 * 电子宠物小狗 - 纯前端版（GitHub Pages）
 * 使用 localStorage 存储，无后端
 */
(function () {
    const STORAGE_KEY = 'mydog_pet';
    const MAX_DIARY = 10;

    function loadPet() {
        try {
            const s = localStorage.getItem(STORAGE_KEY);
            if (s) {
                const p = JSON.parse(s);
                return {
                    name: p.name || '小比',
                    breed: p.breed || 'beagle',
                    energy: clamp(p.energy, 0, 100),
                    happiness: clamp(p.happiness, 0, 100),
                    cleanliness: clamp(p.cleanliness, 0, 100),
                    growth: p.growth || 0,
                    accessory: p.accessory || 'none',
                    sleeping: !!p.sleeping,
                    diary: Array.isArray(p.diary) ? p.diary : []
                };
            }
        } catch (e) {}
        return {
            name: '小比',
            breed: 'beagle',
            energy: 80,
            happiness: 70,
            cleanliness: 100,
            growth: 0,
            accessory: 'none',
            sleeping: false,
            diary: []
        };
    }

    function savePet() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(PET));
        } catch (e) {}
    }

    function clamp(v, a, b) {
        return Math.max(a, Math.min(b, typeof v === 'number' ? v : 0));
    }

    const PET = loadPet();

    const canvas = document.getElementById('pet-canvas');
    const ctx = canvas.getContext('2d');

    let blinkTimer = 0;
    let blinkState = false;
    let currentAnim = null;
    let animStartTime = 0;
    let sleepEnergyInterval = null;

    function addDiary(msg) {
        const t = new Date();
        const entry = { time: t.getHours().toString().padStart(2,'0') + ':' + t.getMinutes().toString().padStart(2,'0'), type: 'event', msg };
        PET.diary = (PET.diary || []).slice(-MAX_DIARY + 1).concat([entry]);
    }

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
        if (data.diary) renderDiary(data.diary);
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

    function drawDog(breed, sleeping, sad) {
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        ctx.clearRect(0, 0, w, h);

        const colors = {
            beagle: { body: '#D4A574', ear: '#8B7355', spot: '#3D2914' },
            pomeranian: { body: '#F5DEB3', ear: '#DEB887', spot: null },
            shiba: { body: '#F4A460', ear: '#8B4513', spot: '#D2691E' }
        };
        const c = colors[breed] || colors.beagle;

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

        const headSize = breed === 'pomeranian' ? 55 : 48;
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.arc(cx, cy - 50, headSize, 0, Math.PI * 2);
        ctx.fill();

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

        if (!sleeping && !blinkState) {
            ctx.strokeStyle = '#2D1B0E';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy - (sad ? 30 : 25), sad ? 8 : 10, 0.2 * Math.PI, 0.8 * Math.PI);
            ctx.stroke();
        }

        ctx.fillStyle = '#2D1B0E';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 42, 8, 6, 0, 0, Math.PI * 2);
        ctx.fill();

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

    function drawAccessory(acc) {
        if (!ctx || acc === 'none') return;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
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

    function drawAnimOverlay(anim, t) {
        if (!ctx || !anim) return;
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        if (anim === 'bone' && t < 1.2) {
            ctx.font = '48px Arial';
            ctx.fillText('🦴', cx - 24, 150 - t * 80);
        } else if (anim === 'ball' && t < 1.2) {
            ctx.font = '40px Arial';
            ctx.fillText('🎾', cx - 20 + Math.sin(t * 5) * 10, 150 - t * 60);
        } else if (anim === 'bubble' && t < 1.5) {
            for (let i = 0; i < 5; i++) {
                ctx.font = '24px Arial';
                ctx.fillText('🫧', cx - 80 + i * 40 + Math.sin(t * 3 + i) * 5, cy + 60 - t * 100 - i * 15);
            }
        } else if (anim === 'zzz' && t < 2) {
            ctx.font = '28px Arial';
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillText('Z'.repeat(Math.floor(t * 3) + 1), cx - 20, 100 - t * 20);
        }
    }

    function playAnim(name) {
        currentAnim = name;
        animStartTime = Date.now() / 1000;
    }

    function render() {
        const now = Date.now() / 1000;
        const sad = PET.energy < 30 || PET.happiness < 30;
        blinkTimer -= 0.016;
        if (blinkTimer <= 0) {
            blinkState = !blinkState;
            blinkTimer = blinkState ? 0.15 : 4 + Math.random() * 3;
        }
        let animElapsed = currentAnim ? now - animStartTime : 0;
        if (animElapsed > 2) currentAnim = null;

        drawDog(PET.breed, PET.sleeping, sad);
        drawAccessory(PET.accessory);
        drawAnimOverlay(currentAnim, animElapsed);
        requestAnimationFrame(render);
    }

    function doFeed() {
        if (PET.sleeping) { showToast('宠物正在睡觉'); return; }
        PET.energy = clamp(PET.energy + 10);
        if (PET.energy >= 100) PET.happiness = clamp(PET.happiness - 5);
        PET.happiness = clamp(PET.happiness);
        PET.growth += 2;
        addDiary('🍖 喂食啦！');
        updateUI({ energy: PET.energy, happiness: PET.happiness, growth: PET.growth, diary: PET.diary });
        savePet();
        playAnim('bone');
    }

    function doPlay() {
        if (PET.sleeping) { showToast('宠物正在睡觉'); return; }
        PET.happiness = clamp(PET.happiness + 15);
        PET.energy = clamp(PET.energy - 5);
        PET.growth += 3;
        addDiary('🎾 一起玩耍！');
        updateUI({ energy: PET.energy, happiness: PET.happiness, growth: PET.growth, diary: PET.diary });
        savePet();
        playAnim('ball');
    }

    function doBathe() {
        if (PET.sleeping) { showToast('宠物正在睡觉'); return; }
        PET.cleanliness = clamp(PET.cleanliness + 20);
        PET.energy = clamp(PET.energy - 5);
        PET.happiness = clamp(PET.happiness + 5);
        PET.growth += 1;
        addDiary('🛁 洗香香！');
        updateUI({ energy: PET.energy, happiness: PET.happiness, cleanliness: PET.cleanliness, growth: PET.growth, diary: PET.diary });
        savePet();
        playAnim('bubble');
    }

    function doSleep() {
        const btn = document.getElementById('btn-sleep');
        PET.sleeping = !PET.sleeping;
        if (PET.sleeping) {
            addDiary('😴 进入梦乡...');
            sleepEnergyInterval = setInterval(tickSleep, 10000);
        } else {
            PET.energy = 100;
            PET.happiness = clamp(PET.happiness + 5);
            addDiary('☀️ 睡醒啦！');
            clearInterval(sleepEnergyInterval);
        }
        setButtonsDisabled(PET.sleeping);
        btn.textContent = PET.sleeping ? '☀️ 唤醒' : '😴 睡觉';
        updateUI({ energy: PET.energy, happiness: PET.happiness, diary: PET.diary });
        savePet();
        playAnim(PET.sleeping ? 'zzz' : null);
    }

    function tickSleep() {
        if (!PET.sleeping) return;
        PET.energy = clamp(PET.energy + 5);
        document.getElementById('bar-energy').style.width = PET.energy + '%';
        document.getElementById('val-energy').textContent = PET.energy;
        savePet();
    }

    function fetchRandomEvent() {
        if (PET.sleeping) return;
        const events = [
            { msg: '🐕 发现骨头！', cleanliness: -5, happiness: 5 },
            { msg: '🤧 打了个可爱的喷嚏！', cleanliness: 0, happiness: 0 },
            { msg: '👋 邻居来玩啦！', cleanliness: 0, happiness: 10 },
            { msg: '☀️ 晒太阳好舒服～', happiness: 5, cleanliness: 0 },
            { msg: '💭 做了美梦！', happiness: 3, cleanliness: 0 }
        ];
        const e = events[Math.floor(Math.random() * events.length)];
        if (e.cleanliness) PET.cleanliness = clamp(PET.cleanliness + e.cleanliness);
        if (e.happiness) PET.happiness = clamp(PET.happiness + e.happiness);
        addDiary(e.msg);
        showToast(e.msg);
        updateUI({ happiness: PET.happiness, cleanliness: PET.cleanliness, diary: PET.diary });
        savePet();
    }

    function bindEvents() {
        document.getElementById('btn-edit-name').onclick = () => {
            document.getElementById('edit-name-form').classList.remove('hidden');
            document.getElementById('name-input').value = PET.name;
        };
        document.getElementById('btn-cancel-edit').onclick = () => {
            document.getElementById('edit-name-form').classList.add('hidden');
        };
        document.getElementById('btn-save-name').onclick = () => {
            const name = (document.getElementById('name-input').value.trim() || '小比').slice(0, 20);
            PET.name = name;
            document.getElementById('pet-name').textContent = name;
            document.getElementById('edit-name-form').classList.add('hidden');
            savePet();
        };

        document.getElementById('breed-select').onchange = (e) => {
            PET.breed = e.target.value;
            savePet();
        };

        document.querySelectorAll('.acc-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.acc-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                PET.accessory = btn.dataset.acc;
                savePet();
            };
        });

        document.querySelectorAll('.acc-btn').forEach(b => {
            if (b.dataset.acc === PET.accessory) b.classList.add('active');
            else b.classList.remove('active');
        });

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

    function init() {
        document.getElementById('pet-name').textContent = PET.name;
        document.getElementById('breed-select').value = PET.breed;
        updateUI({
            energy: PET.energy,
            happiness: PET.happiness,
            cleanliness: PET.cleanliness,
            growth: PET.growth,
            diary: PET.diary
        });
        renderDiary(PET.diary);
        bindEvents();
        render();
        setInterval(fetchRandomEvent, 30000);
    }

    init();

    window.updatePetFromGame = function (data) {
        Object.assign(PET, data);
        updateUI(data);
        savePet();
    };

    window.handleGameResult = function (success) {
        if (success) {
            PET.happiness = clamp(PET.happiness + 15);
            PET.energy = clamp(PET.energy - 8);
            addDiary('🏆 接住飞盘啦！');
        } else {
            PET.happiness = clamp(PET.happiness + 5);
            PET.energy = clamp(PET.energy - 3);
            addDiary('😅 没接住...');
        }
        PET.growth += 2;
        updateUI({ energy: PET.energy, happiness: PET.happiness, growth: PET.growth, diary: PET.diary });
        savePet();
    };
})();
