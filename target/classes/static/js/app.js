/* ============================================================
   app.js — Core platform: Auth, Navigation, Leaderboard, Toast & Sound
   ============================================================ */
const API = 'http://localhost:8080/api';

/* ---- Token Storage ---- */
const Store = {
    getToken: () => localStorage.getItem('mitron_token') || localStorage.getItem('gv_token'),
    getUser:  () => localStorage.getItem('mitron_user') || localStorage.getItem('gv_user'),
    set: (token, user) => { 
        localStorage.setItem('mitron_token', token); 
        localStorage.setItem('mitron_user', user); 
    },
    clear: () => { 
        localStorage.removeItem('mitron_token'); 
        localStorage.removeItem('mitron_user'); 
        localStorage.removeItem('gv_token'); 
        localStorage.removeItem('gv_user'); 
    }
};

/* ---- Toast Notification ---- */
function toast(msg, type = 'info', duration = 3000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `show ${type}`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.className = '', duration);
}

/* ---- Score Submission ---- */
async function submitScore(gameName, score) {
    const token = Store.getToken();
    if (!token) { 
        toast('Sign in to submit your score to Mitron Leaderboard! 🏆', 'info'); 
        return; 
    }
    try {
        const res = await fetch(`${API}/scores/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ gameName, score })
        });
        const data = await res.json();
        if (res.ok) {
            toast(`Awesome! High Score: ${data.highScore} ⚡`, 'success');
            LB.load(gameName);
        }
    } catch (e) { 
        console.error('Score submit error:', e); 
    }
}

/* ---- Navigation ---- */
function navigate(page) {
    Sound.nav();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) targetPage.classList.add('active');

    const targetNav = document.querySelector(`[data-page="${page}"]`);
    if (targetNav) targetNav.classList.add('active');

    // Auto-load leaderboard for selected game
    if (page === 'ttt')    LB.load('ttt');
    if (page === 'snake')  LB.load('snake');
    if (page === 'memory') LB.load('memory');

    // Init games dynamically on visit
    if (page === 'ttt'    && !TTT._init)    { TTT.init();    TTT._init = true; }
    if (page === 'snake'  && !Snake._init)  { Snake.init();  Snake._init = true; }
    if (page === 'memory' && !Memory._init) { Memory.init(); Memory._init = true; }
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => navigate(item.dataset.page));
});

/* ---- Auth Management ---- */
const Auth = (() => {
    let mode = 'login';

    function openModal(m = 'login') {
        Sound.click();
        mode = m;
        document.getElementById('auth-modal').classList.add('open');
        document.getElementById('modal-title').textContent    = m === 'login' ? 'Welcome Back!' : 'Join Mitron Island';
        document.getElementById('modal-subtitle').textContent = m === 'login' ? 'Sign in to save your game ranks & bests' : 'Create an arcade profile and compete!';
        document.getElementById('modal-submit-btn').textContent = m === 'login' ? 'Sign In 🚀' : 'Start Playing 🌟';
        document.getElementById('register-field').style.display = m === 'login' ? 'none' : 'block';
        document.getElementById('modal-switch').innerHTML = m === 'login'
            ? 'No account yet? <a onclick="Auth.switchMode()">Register here</a>'
            : 'Already have an account? <a onclick="Auth.switchMode()">Sign in</a>';
        document.getElementById('modal-error').style.display = 'none';
        document.getElementById('auth-username').value = '';
        document.getElementById('auth-password').value = '';
        document.getElementById('auth-email').value = '';
    }

    function closeModal() { 
        Sound.click();
        document.getElementById('auth-modal').classList.remove('open'); 
    }
    
    function switchMode() { 
        openModal(mode === 'login' ? 'register' : 'login'); 
    }

    async function submit() {
        const username = document.getElementById('auth-username').value.trim();
        const password = document.getElementById('auth-password').value;
        const email    = document.getElementById('auth-email').value.trim();
        const btn      = document.getElementById('modal-submit-btn');

        if (!username || !password) { showError('Please fill in all fields'); return; }
        if (mode === 'register' && !email) { showError('Email is required'); return; }

        btn.textContent = 'Connecting...'; 
        btn.disabled = true;

        try {
            const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
            const body     = mode === 'login'
                ? { username, password }
                : { username, email, password };

            const res  = await fetch(`${API}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();

            if (res.ok) {
                Store.set(data.token, data.username);
                updateUILoggedIn(data.username);
                closeModal();
                Sound.win();
                toast(`Ready to rock, ${data.username}! 🌴`, 'success');
            } else {
                Sound.gameOver();
                showError(data.error || 'Authentication failed');
            }
        } catch (e) {
            Sound.gameOver();
            showError('Server unreachable. Please check backend.');
        } finally {
            btn.textContent = mode === 'login' ? 'Sign In 🚀' : 'Start Playing 🌟';
            btn.disabled = false;
        }
    }

    function showError(msg) {
        const el = document.getElementById('modal-error');
        el.textContent = msg; 
        el.style.display = 'block';
    }

    return { openModal, closeModal, switchMode, submit };
})();

function updateUILoggedIn(username) {
    document.getElementById('user-badge').style.display = 'flex';
    document.getElementById('username-display').textContent = username;
    document.getElementById('avatar-initial').textContent = username[0].toUpperCase();
    document.getElementById('btn-login').style.display    = 'none';
    document.getElementById('btn-register').style.display = 'none';
    document.getElementById('btn-logout').style.display   = 'inline-flex';
}

function updateUILoggedOut() {
    document.getElementById('user-badge').style.display   = 'none';
    document.getElementById('btn-login').style.display    = 'inline-flex';
    document.getElementById('btn-register').style.display = 'inline-flex';
    document.getElementById('btn-logout').style.display   = 'none';
}

/* ---- Wire up buttons ---- */
document.getElementById('btn-login').onclick    = () => Auth.openModal('login');
document.getElementById('btn-register').onclick = () => Auth.openModal('register');
document.getElementById('modal-submit-btn').onclick = () => Auth.submit();
document.getElementById('btn-logout').onclick   = () => {
    Sound.click();
    Store.clear(); 
    updateUILoggedOut(); 
    toast('Logged out from Mitron! 👋', 'info');
};

/* Sound toggle button */
const soundBtn = document.getElementById('btn-sound-toggle');
if (soundBtn) {
    soundBtn.onclick = () => {
        const enabled = Sound.toggle();
        soundBtn.textContent = enabled ? '🔊 Sound On' : '🔇 Muted';
        soundBtn.classList.toggle('muted', !enabled);
        if (enabled) Sound.click();
    };
}

/* Close modal on backdrop click */
document.getElementById('auth-modal').addEventListener('click', e => {
    if (e.target.id === 'auth-modal') Auth.closeModal();
});

/* Enter key support in modal */
['auth-username','auth-password','auth-email'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') Auth.submit();
    });
});

/* ---- Leaderboard Component ---- */
const LB = (() => {
    let current = 'ttt';

    async function load(game) {
        current = game;
        document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
        const tabMap = { ttt: 0, snake: 1, memory: 2 };
        document.querySelectorAll('.lb-tab')[tabMap[game]]?.classList.add('active');

        const list = document.getElementById('lb-list');
        list.innerHTML = '<div class="lb-empty">Refreshing scores...</div>';

        try {
            const res   = await fetch(`${API}/scores/leaderboard/${game}`);
            const data  = await res.json();
            if (!data.length) { 
                list.innerHTML = '<div class="lb-empty">No champions yet! Be the first! 🌴🥇</div>'; 
                return; 
            }

            list.innerHTML = data.map((entry, i) => {
                const rankClass = ['r1','r2','r3'][i] || 'rn';
                const medal     = ['🥇','🥈','🥉'][i] || (i + 1);
                return `
                <div class="lb-entry">
                    <div class="lb-rank ${rankClass}">${medal}</div>
                    <div class="lb-entry-info">
                        <div class="lb-entry-name">${entry.username}</div>
                        <div class="lb-entry-score">${formatScore(game, entry.score)}</div>
                    </div>
                </div>`;
            }).join('');
        } catch (e) {
            list.innerHTML = '<div class="lb-empty">Backend offline</div>';
        }
    }

    function formatScore(game, score) {
        if (game === 'snake')  return `${score} pts`;
        if (game === 'memory') return `${score} pts`;
        return `${score} Wins`;
    }

    return { load };
})();

/* ---- Restore session on page load ---- */
(function init() {
    const user = Store.getUser();
    if (user) updateUILoggedIn(user);
    LB.load('ttt');
})();
