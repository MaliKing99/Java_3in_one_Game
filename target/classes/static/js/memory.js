/* ============================================================
   memory.js — Memory Match Game Module with Sound Effects
   ============================================================ */
const Memory = (() => {
    // Dynamic colorful tropical emojis
    const EMOJIS = ['🌴', '🌺', '🥥', '🍍', '🏄‍♂️', '🦜', '🦀', '⭐'];
    const PAIRS = EMOJIS.length; // 8 pairs = 16 cards

    let cards, flipped, matched, moves, startTime, timerInterval, locked;

    function init() { restart(); }

    function restart() {
        clearInterval(timerInterval);
        Sound.stopMemoryWinMusic();
        Sound.click();
        flipped = [];
        matched = 0;
        moves = 0;
        locked = false;
        startTime = null;

        document.getElementById('mem-moves').textContent = 0;
        document.getElementById('mem-pairs').textContent = `0/${PAIRS}`;
        document.getElementById('mem-time').textContent = '0s';
        document.getElementById('memory-gameover').classList.remove('show');

        cards = shuffle([...EMOJIS, ...EMOJIS]);
        renderBoard();
    }

    function renderBoard() {
        const board = document.getElementById('memory-board');
        board.innerHTML = '';
        cards.forEach((emoji, i) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = i;
            card.dataset.emoji = emoji;
            card.innerHTML = `
                <div class="card-inner">
                    <div class="card-face card-back">🌊</div>
                    <div class="card-face card-front">${emoji}</div>
                </div>`;
            card.addEventListener('click', () => flipCard(card));
            board.appendChild(card);
        });
    }

    function flipCard(card) {
        if (locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;

        Sound.flip();

        if (!startTime) {
            startTime = Date.now();
            timerInterval = setInterval(() => {
                document.getElementById('mem-time').textContent =
                    Math.floor((Date.now() - startTime) / 1000) + 's';
            }, 500);
        }

        card.classList.add('flipped');
        flipped.push(card);

        if (flipped.length === 2) {
            locked = true;
            moves++;
            document.getElementById('mem-moves').textContent = moves;
            checkMatch();
        }
    }

    function checkMatch() {
        const [a, b] = flipped;
        if (a.dataset.emoji === b.dataset.emoji) {
            Sound.match();
            a.classList.add('matched');
            b.classList.add('matched');
            matched++;
            document.getElementById('mem-pairs').textContent = `${matched}/${PAIRS}`;
            flipped = [];
            locked = false;
            if (matched === PAIRS) onWin();
        } else {
            setTimeout(() => {
                a.classList.remove('flipped');
                b.classList.remove('flipped');
                flipped = [];
                locked = false;
            }, 850);
        }
    }

    function onWin() {
        clearInterval(timerInterval);
        // Play only the music/audio from the provided video upon victory!
        Sound.playMemoryWinMusic();
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        // Score = 1000 - moves*10 - time*2, min 100
        const score = Math.max(100, 1000 - moves * 10 - elapsed * 2);
        document.getElementById('memory-final-score').textContent = `Score: ${score} | Moves: ${moves} | Time: ${elapsed}s`;
        setTimeout(() => document.getElementById('memory-gameover').classList.add('show'), 400);
        submitScore('memory', score);
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    return { init, restart };
})();
