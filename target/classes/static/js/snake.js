/* ============================================================
   snake.js — Snake Game Module with Sound Effects
   ============================================================ */
const Snake = (() => {
    const GRID = 20;
    const CELL = 20; // canvas 400px / 20 cells
    const SPEED_INIT = 150;
    const SPEED_MIN = 60;

    let canvas, ctx;
    let snake, dir, nextDir, food, score, bestScore, gameLoop, paused, running;

    function init() {
        canvas = document.getElementById('snake-canvas');
        ctx = canvas.getContext('2d');
        bestScore = parseInt(localStorage.getItem('snake_best') || '0');
        document.getElementById('snake-best').textContent = bestScore;
        drawIdle();
        document.addEventListener('keydown', handleKey);
    }

    function drawIdle() {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 20px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press START to play 🐍', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('Use Arrow Keys or WASD to Drive', canvas.width / 2, canvas.height / 2 + 22);
    }

    function start() {
        if (running) return;
        Sound.click();
        document.getElementById('snake-start-btn').style.display = 'none';
        document.getElementById('snake-pause-btn').style.display = 'inline-block';
        document.getElementById('snake-gameover').classList.remove('show');
        restart();
    }

    function restart() {
        clearInterval(gameLoop);
        Sound.click();
        snake = [{ x: 10, y: 10 }];
        dir = { x: 1, y: 0 };
        nextDir = { x: 1, y: 0 };
        score = 0;
        paused = false;
        running = true;
        document.getElementById('snake-gameover').classList.remove('show');
        document.getElementById('snake-start-btn').style.display = 'none';
        document.getElementById('snake-pause-btn').style.display = 'inline-block';
        document.getElementById('snake-pause-btn').textContent = 'Pause';
        document.getElementById('snake-score').textContent = 0;
        placeFood();
        const speed = SPEED_INIT;
        gameLoop = setInterval(tick, speed);
    }

    function tick() {
        if (paused) return;
        dir = { ...nextDir };

        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

        // Wall collision
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) { endGame(); return; }
        // Self collision
        if (snake.some(s => s.x === head.x && s.y === head.y)) { endGame(); return; }

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score += 10;
            Sound.eat();
            document.getElementById('snake-score').textContent = score;
            // Speed up every 50 pts
            const newSpeed = Math.max(SPEED_MIN, SPEED_INIT - Math.floor(score / 50) * 10);
            clearInterval(gameLoop);
            gameLoop = setInterval(tick, newSpeed);
            placeFood();
        } else {
            snake.pop();
        }

        draw();
    }

    function draw() {
        // Vibrant tropical arcade canvas background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Animated neon beach grid
        ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
        for (let x = 0; x < GRID; x++) {
            for (let y = 0; y < GRID; y++) {
                ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
            }
        }

        // Snake body with glowing tropical gradient
        snake.forEach((seg, i) => {
            const isHead = i === 0;
            if (isHead) {
                ctx.fillStyle = '#f59e0b'; // Gold head
            } else {
                const ratio = 1 - (i / snake.length) * 0.6;
                ctx.fillStyle = `rgba(16, 185, 129, ${ratio})`; // Emerald neon trail
            }
            ctx.beginPath();
            ctx.roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, isHead ? 6 : 4);
            ctx.fill();
        });

        // Tropical fruit / power-up item
        ctx.font = `${CELL - 2}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText('🥭', food.x * CELL + CELL / 2, food.y * CELL + CELL - 2);
    }

    function placeFood() {
        do { food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
        while (snake.some(s => s.x === food.x && s.y === food.y));
    }

    function endGame() {
        clearInterval(gameLoop);
        running = false;
        Sound.gameOver();
        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('snake_best', bestScore);
            document.getElementById('snake-best').textContent = bestScore;
        }
        document.getElementById('snake-final-score').textContent = `Score: ${score}`;
        document.getElementById('snake-gameover').classList.add('show');
        document.getElementById('snake-pause-btn').style.display = 'none';
        document.getElementById('snake-start-btn').style.display = 'inline-block';
        document.getElementById('snake-start-btn').textContent = 'Play Again';
        submitScore('snake', score);
    }

    function togglePause() {
        if (!running) return;
        paused = !paused;
        Sound.click();
        document.getElementById('snake-pause-btn').textContent = paused ? 'Resume' : 'Pause';
        if (!paused) draw();
    }

    function handleKey(e) {
        const map = {
            ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
            ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
            ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
            ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }
        };
        const newDir = map[e.key];
        if (newDir) {
            e.preventDefault();
            // Prevent 180-degree reversal
            if (newDir.x !== -dir.x || newDir.y !== -dir.y) nextDir = newDir;
        }
        if (e.key === 'p' || e.key === 'P') togglePause();
    }

    return { init, start, restart, togglePause };
})();
