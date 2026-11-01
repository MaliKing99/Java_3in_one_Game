/* ============================================================
   ttt.js — Tic-Tac-Toe Game Module with Sound Effects
   ============================================================ */
const TTT = (() => {
    const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

    let board, currentPlayer, gameOver;
    let scores = { X: 0, O: 0, D: 0 };

    function init() {
        renderBoard();
        reset();
    }

    function renderBoard() {
        const el = document.getElementById('ttt-board');
        el.innerHTML = '';
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'ttt-cell';
            cell.dataset.index = i;
            cell.addEventListener('click', () => handleClick(i));
            el.appendChild(cell);
        }
    }

    function reset() {
        board = Array(9).fill('');
        currentPlayer = 'X';
        gameOver = false;
        document.querySelectorAll('.ttt-cell').forEach(c => {
            c.textContent = '';
            c.className = 'ttt-cell';
        });
        setStatus(`Player ${currentPlayer}'s turn`);
    }

    function resetAll() {
        Sound.click();
        scores = { X: 0, O: 0, D: 0 };
        updateScoreUI();
        reset();
    }

    function handleClick(i) {
        if (gameOver || board[i]) return;
        board[i] = currentPlayer;

        Sound.placePiece(currentPlayer === 'X');

        const cell = document.querySelector(`[data-index="${i}"]`);
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer.toLowerCase());

        const winCombo = checkWin();
        if (winCombo) {
            winCombo.forEach(idx => document.querySelector(`[data-index="${idx}"]`).classList.add('winning'));
            scores[currentPlayer]++;
            updateScoreUI();
            setStatus(`🎉 Player ${currentPlayer} wins!`);
            gameOver = true;
            Sound.win();
            
            const winnerScore = currentPlayer === 'X' ? scores.X : scores.O;
            submitScore('ttt', winnerScore);
            setTimeout(reset, 2400);
            return;
        }

        if (board.every(v => v)) {
            scores.D++;
            updateScoreUI();
            setStatus("It's a Draw! 🤝");
            gameOver = true;
            Sound.gameOver();
            setTimeout(reset, 2000);
            return;
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        setStatus(`Player ${currentPlayer}'s turn`);
    }

    function checkWin() {
        return WINS.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]) || null;
    }

    function setStatus(msg) { document.getElementById('ttt-status').textContent = msg; }

    function updateScoreUI() {
        document.getElementById('ttt-score-x').textContent = scores.X;
        document.getElementById('ttt-score-o').textContent = scores.O;
        document.getElementById('ttt-score-d').textContent = scores.D;
    }

    return { init, reset, resetAll };
})();
