/* ============================================================
   sound.js — Dynamic Audio Synthesizer via Web Audio API
   ============================================================ */
const Sound = (() => {
    let ctx = null;
    let enabled = true;

    function getAudioContext() {
        if (!ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                ctx = new AudioContextClass();
            }
        }
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    }

    function toggle() {
        enabled = !enabled;
        return enabled;
    }

    function isEnabled() {
        return enabled;
    }

    // Play a basic tone
    function playTone(freq, type = 'sine', duration = 0.15, vol = 0.2, rampTo = null) {
        if (!enabled) return;
        try {
            const ac = getAudioContext();
            if (!ac) return;
            const osc = ac.createOscillator();
            const gain = ac.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ac.currentTime);
            if (rampTo) {
                osc.frequency.exponentialRampToValueAtTime(rampTo, ac.currentTime + duration);
            }

            gain.gain.setValueAtTime(vol, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

            osc.connect(gain);
            gain.connect(ac.destination);

            osc.start();
            osc.stop(ac.currentTime + duration);
        } catch (e) {
            console.warn('Audio error:', e);
        }
    }

    // UI Click sound (crisp bubble/click)
    function click() {
        playTone(600, 'triangle', 0.08, 0.15, 800);
    }

    // UI Navigation whoosh
    function nav() {
        playTone(400, 'sine', 0.12, 0.18, 650);
    }

    // Move sound (e.g. Tic Tac Toe, Snake turn)
    function placePiece(isX = true) {
        if (isX) {
            playTone(520, 'sine', 0.12, 0.22, 680);
        } else {
            playTone(380, 'sine', 0.14, 0.22, 480);
        }
    }

    // Snake eat apple
    function eat() {
        if (!enabled) return;
        try {
            const ac = getAudioContext();
            if (!ac) return;
            const osc1 = ac.createOscillator();
            const osc2 = ac.createOscillator();
            const gain = ac.createGain();

            osc1.type = 'triangle';
            osc2.type = 'sine';
            osc1.frequency.setValueAtTime(400, ac.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(850, ac.currentTime + 0.12);
            osc2.frequency.setValueAtTime(800, ac.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.12);

            gain.gain.setValueAtTime(0.25, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ac.destination);

            osc1.start();
            osc2.start();
            osc1.stop(ac.currentTime + 0.15);
            osc2.stop(ac.currentTime + 0.15);
        } catch (e) {}
    }

    // Card flip sound
    function flip() {
        playTone(320, 'triangle', 0.09, 0.2, 500);
    }

    // Pair matched fanfare
    function match() {
        if (!enabled) return;
        try {
            const ac = getAudioContext();
            if (!ac) return;
            [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ac.currentTime + i * 0.08);
                gain.gain.setValueAtTime(0.2, ac.currentTime + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.08 + 0.2);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(ac.currentTime + i * 0.08);
                osc.stop(ac.currentTime + i * 0.08 + 0.22);
            });
        } catch (e) {}
    }

    // Victory cheer / win jingle
    function win() {
        if (!enabled) return;
        try {
            const ac = getAudioContext();
            if (!ac) return;
            const notes = [440, 554.37, 659.25, 880];
            notes.forEach((freq, idx) => {
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ac.currentTime + idx * 0.1);
                gain.gain.setValueAtTime(0.3, ac.currentTime + idx * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + idx * 0.1 + 0.45);
                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(ac.currentTime + idx * 0.1);
                osc.stop(ac.currentTime + idx * 0.1 + 0.5);
            });
        } catch (e) {}
    }

    // Game over / crash sound
    function gameOver() {
        if (!enabled) return;
        try {
            const ac = getAudioContext();
            if (!ac) return;
            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, ac.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.4);
            gain.gain.setValueAtTime(0.3, ac.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start();
            osc.stop(ac.currentTime + 0.45);
        } catch (e) {}
    }

    // Play only the audio track from the uploaded video for Memory Match victory
    function playMemoryWinMusic() {
        if (!enabled) return;
        try {
            const audio = document.getElementById('memory-win-audio');
            if (audio) {
                audio.currentTime = 0;
                audio.volume = 0.85;
                audio.play().catch(err => {
                    console.log('Audio autoplay policy prevented playback or format handling:', err);
                    // Fallback to synthesized fanfare if browser blocks media tag
                    win();
                });
            } else {
                win();
            }
        } catch (e) {
            win();
        }
    }

    function stopMemoryWinMusic() {
        try {
            const audio = document.getElementById('memory-win-audio');
            if (audio) {
                audio.pause();
                audio.currentTime = 0;
            }
        } catch (e) {}
    }

    // Unlock / resume sound on first user gesture
    window.addEventListener('click', () => {
        if (ctx && ctx.state === 'suspended') ctx.resume();
    }, { once: true });

    return {
        click,
        nav,
        placePiece,
        eat,
        flip,
        match,
        win,
        gameOver,
        playMemoryWinMusic,
        stopMemoryWinMusic,
        toggle,
        isEnabled
    };
})();

