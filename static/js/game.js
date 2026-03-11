/**
 * 接球小游戏 - 点击扔飞盘，小狗跑去接
 */
(function () {
    const overlay = document.getElementById('game-overlay');
    const gameCanvas = document.getElementById('game-canvas');
    const closeBtn = document.getElementById('btn-close-game');

    if (!gameCanvas) return;

    const ctx = gameCanvas.getContext('2d');
    const W = gameCanvas.width;
    const H = gameCanvas.height;

    let ball = null;      // { x, y, vx, vy, thrown }
    let dog = { x: W / 2 - 30, y: H - 80, targetX: null, state: 'idle' };
    let gameOver = false;
    let result = null;
    let lastTime = 0;

    function drawDog(x, y) {
        ctx.fillStyle = '#D4A574';
        ctx.beginPath();
        ctx.ellipse(x + 30, y + 50, 35, 25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 30, y + 20, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B7355';
        ctx.beginPath();
        ctx.ellipse(x + 5, y - 5, 10, 20, -0.3, 0, Math.PI * 2);
        ctx.ellipse(x + 55, y - 5, 10, 20, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2D1B0E';
        ctx.beginPath();
        ctx.arc(x + 22, y + 18, 3, 0, Math.PI * 2);
        ctx.arc(x + 38, y + 18, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawBall(x, y) {
        ctx.font = '32px Arial';
        ctx.fillText('🥏', x - 16, y + 12);
    }

    function throwBall(clickX) {
        if (ball || gameOver) return;
        const startX = W / 2;
        const startY = H - 50;
        const dx = clickX - startX;
        const dist = Math.abs(dx);
        const power = Math.min(dist * 0.5, 150);
        const vx = (dx / (dist || 1)) * power * 0.05;
        const vy = -8 - Math.random() * 4;
        ball = { x: startX, y: startY, vx, vy, thrown: true };
        dog.targetX = startX;
        dog.state = 'running';
    }

    function update(t) {
        const dt = Math.min((t - lastTime) / 1000, 0.05);
        lastTime = t;

        if (ball && ball.thrown) {
            ball.vy += 25 * dt;
            ball.x += ball.vx * 60 * dt;
            ball.y += ball.vy * 60 * dt;
            dog.targetX = ball.x;  // 小狗追逐飞盘
            if (ball.y > H) {
                const landX = ball.x;
                ball = null;
                const dist = Math.abs(dog.x + 30 - landX);
                result = dist < 55 ? 'success' : 'fail';
                gameOver = true;
                showResult();
                return;
            }
        }

        if (dog.state === 'running' && dog.targetX !== null) {
            const speed = 220 * dt;
            if (Math.abs(dog.x + 30 - dog.targetX) > 5) {
                dog.x += (dog.targetX - dog.x - 30) > 0 ? speed : -speed;
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#E8F5E9';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#C8E6C9';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(0, H - 20 - i * 30);
            ctx.lineTo(W, H - 20 - i * 30);
            ctx.stroke();
        }
        drawDog(dog.x, dog.y);
        if (ball) drawBall(ball.x, ball.y);
        if (result) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(result === 'success' ? '🐕 接住啦！' : '😅 没接住...', W / 2, H / 2);
        }
    }

    function showResult() {
        setTimeout(async () => {
            const res = await fetch('/game_result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: result === 'success' })
            }).then(r => r.json());
            if (window.updatePetFromGame) window.updatePetFromGame(res);
            closeGame();
        }, 1500);
    }

    function loop(t) {
        if (!overlay.classList.contains('hidden')) {
            update(t);
            draw();
        }
        requestAnimationFrame(loop);
    }

    function openGame() {
        overlay.classList.remove('hidden');
        ball = null;
        dog = { x: W / 2 - 30, y: H - 80, targetX: null, state: 'idle' };
        gameOver = false;
        result = null;
        lastTime = performance.now();
    }

    function closeGame() {
        overlay.classList.add('hidden');
    }

    gameCanvas.onclick = (e) => {
        const rect = gameCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (W / rect.width);
        throwBall(x);
    };

    closeBtn.onclick = closeGame;

    requestAnimationFrame(loop);
    window.openCatchGame = openGame;
})();
