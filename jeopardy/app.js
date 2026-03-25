// ============================================================
// RESORTCOM GDL - TRIVIA MUNDIAL - JEOPARDY v6 MULTI-PANTALLA
// Firebase Realtime Database sync across 5 screens
// ALL 8 FIXES APPLIED
// ============================================================

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDC_Ru69_A9G-Q6apXTHgvFIj6uS9aP15Y",
    authDomain: "others-2c89f.firebaseapp.com",
    databaseURL: "https://others-2c89f-default-rtdb.firebaseio.com",
    projectId: "others-2c89f",
    storageBucket: "others-2c89f.firebasestorage.app",
    messagingSenderId: "31730738435",
    appId: "1:31730738435:web:226da3fb90fa926c71b536"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const GAME_REF = db.ref('jeopardy');

const POINT_VALUES = [100, 200, 300, 400, 500];
// FIX 7: Timer variable by difficulty
const TIMER_BY_POINTS = { 0: 20, 1: 25, 2: 30, 3: 35, 4: 40 };
const countryKeys = Object.keys(QUESTIONS_DB);
const ADMIN_PASSWORD = 'resortcom';
const MIN_QUESTIONS_FOR_RESULTS = 3; // FIX 6: minimum before showing results

const state = {
    myMesa: null,
    myCountryLeft: null,
    myCountryRight: null,
    role: null, // 'host' | 'playerLeft' | 'playerRight'
    buzzerWinner: null,
    currentCategory: null,
    currentRow: null,
    answered: false,
    timer: null,
    timerValue: 30,
    timerMax: 30,
    dropdownOpen: null,
    scores: {},
    usedCells: {},
    mesas: {},
    questionsAnswered: 0,
    buzzerPressed: false
};

// FIX 4: Track listener references for cleanup
let mesaCellsRef = null;
let scoresRef = null;
let mesasRef = null;

const screens = {
    welcome: document.getElementById('welcomeScreen'),
    mesa: document.getElementById('mesaScreen'),
    role: document.getElementById('roleScreen'),
    assign: document.getElementById('assignScreen'),
    buzzer: document.getElementById('buzzerScreen'),
    board: document.getElementById('boardScreen'),
    question: document.getElementById('questionScreen'),
    result: document.getElementById('resultScreen'),
    playerBuzzer: document.getElementById('playerBuzzerScreen'),
    playerQuestion: document.getElementById('playerQuestionScreen')
};

let buzzerSyncRef = null;
let questionSyncRef = null;

// ===== AUDIO =====
let audioCtx = null;
function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, t);
        osc.frequency.setValueAtTime(659.25, t + 0.1);
        osc.frequency.setValueAtTime(783.99, t + 0.2);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.start(); osc.stop(t + 0.5);
    } else if (type === 'incorrect') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.setValueAtTime(150, t + 0.2);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        osc.start(); osc.stop(t + 0.4);
    } else if (type === 'click') {
        osc.frequency.setValueAtTime(800, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(); osc.stop(t + 0.1);
    } else if (type === 'buzzer') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(880, t + 0.05);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.start(); osc.stop(t + 0.2);
    } else if (type === 'victory') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
            o.connect(g); g.connect(audioCtx.destination);
            o.frequency.setValueAtTime(freq, t + i * 0.15);
            g.gain.setValueAtTime(0.25, t + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.01, t + i * 0.15 + 0.3);
            o.start(t + i * 0.15); o.stop(t + i * 0.15 + 0.3);
        });
    } else if (type === 'tick') {
        osc.frequency.setValueAtTime(1000, t);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
        osc.start(); osc.stop(t + 0.05);
    } else if (type === 'select') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.setValueAtTime(900, t + 0.08);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.start(); osc.stop(t + 0.15);
    }
}

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

// ===== FIX 1: localStorage persistence =====
function saveSession() {
    if (state.myMesa && state.myCountryLeft && state.myCountryRight) {
        localStorage.setItem('jeopardy_session', JSON.stringify({
            mesa: state.myMesa,
            left: state.myCountryLeft,
            right: state.myCountryRight,
            role: state.role
        }));
    }
}

function clearSession() {
    localStorage.removeItem('jeopardy_session');
}

function tryRestoreSession() {
    const saved = localStorage.getItem('jeopardy_session');
    if (!saved) return false;

    try {
        const session = JSON.parse(saved);
        // Verify mesa still exists in Firebase with same countries
        GAME_REF.child(`mesas/mesa${session.mesa}`).once('value', snap => {
            const data = snap.val();
            if (data && data.countries &&
                data.countries[0] === session.left &&
                data.countries[1] === session.right) {
                // Session valid — reconnect!
                state.myMesa = session.mesa;
                state.myCountryLeft = session.left;
                state.myCountryRight = session.right;
                state.role = session.role || null;
                listenToMyMesaCells();
                showReconnectToast();
                if (state.role && state.role !== 'host') {
                    startPlayerMode();
                } else if (state.role === 'host') {
                    goToBuzzer();
                } else {
                    showRoleSelection();
                }
            } else {
                // Mesa was released or changed — clear
                clearSession();
            }
        });
        return true;
    } catch (e) {
        clearSession();
        return false;
    }
}

function showReconnectToast() {
    const toast = document.createElement('div');
    toast.className = 'reconnect-toast';
    toast.textContent = `✅ Reconectado a Mesa ${state.myMesa}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ===== PARTICLES =====
function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const colors = ['#E63946', '#2ECC71', '#3498DB', '#F1C40F'];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    class P {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
            this.s = Math.random() * 3 + 1; this.sx = (Math.random() - 0.5) * 0.5;
            this.sy = (Math.random() - 0.5) * 0.5;
            this.c = colors[Math.floor(Math.random() * colors.length)];
            this.o = Math.random() * 0.5 + 0.1;
        }
        update() { this.x += this.sx; this.y += this.sy; if (this.x < 0 || this.x > canvas.width) this.sx *= -1; if (this.y < 0 || this.y > canvas.height) this.sy *= -1; }
        draw() { ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI * 2); ctx.fillStyle = this.c; ctx.globalAlpha = this.o; ctx.fill(); ctx.globalAlpha = 1; }
    }
    for (let i = 0; i < 60; i++) particles.push(new P());
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 150) {
                    ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = particles[i].c;
                    ctx.globalAlpha = 0.04 * (1 - d / 150);
                    ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}

// ===== CONFETTI =====
function launchConfetti() {
    const c = document.getElementById('confettiContainer'); c.innerHTML = '';
    const clrs = ['#E63946', '#2ECC71', '#3498DB', '#F1C40F', '#FF6B6B', '#55E89D', '#5DADE2', '#F7DC6F'];
    for (let i = 0; i < 150; i++) {
        const p = document.createElement('div'); p.className = 'confetti-piece';
        p.style.left = Math.random() * 100 + '%';
        p.style.backgroundColor = clrs[Math.floor(Math.random() * clrs.length)];
        p.style.width = (Math.random() * 12 + 5) + 'px'; p.style.height = (Math.random() * 12 + 5) + 'px';
        p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        p.style.animationDuration = (Math.random() * 2 + 2) + 's';
        p.style.animationDelay = Math.random() * 2 + 's';
        c.appendChild(p);
    }
    setTimeout(() => { c.innerHTML = ''; }, 5000);
}

// ===== FIX 4: Firebase listeners with cleanup =====
function initFirebaseListeners() {
    // Cleanup existing listeners first
    if (scoresRef) scoresRef.off();
    if (mesasRef) mesasRef.off();

    // Listen to global scores
    scoresRef = GAME_REF.child('scores');
    scoresRef.on('value', snap => {
        const data = snap.val() || {};
        countryKeys.forEach(key => { state.scores[key] = data[key] || 0; });
        renderAllScoreboards();
    });

    // Listen to mesas
    mesasRef = GAME_REF.child('mesas');
    mesasRef.on('value', snap => {
        state.mesas = snap.val() || {};
        updateMesaCards();
    });
}

function listenToMyMesaCells() {
    // FIX 4: Clean up previous listener before setting new one
    if (mesaCellsRef) mesaCellsRef.off();
    mesaCellsRef = GAME_REF.child(`usedCells/mesa${state.myMesa}`);
    mesaCellsRef.on('value', snap => {
        state.usedCells = snap.val() || {};
        // FIX 8: Count answered questions
        state.questionsAnswered = Object.keys(state.usedCells).length;
    });
}

// Initialize scores in Firebase if they don't exist
function initScoresInFirebase() {
    GAME_REF.child('scores').once('value', snap => {
        if (!snap.val()) {
            const init = {};
            countryKeys.forEach(key => { init[key] = 0; });
            GAME_REF.child('scores').set(init);
        }
    });
}

// ===== SCOREBOARD =====
function renderScoreboard(containerId, highlightKey) {
    const sb = document.getElementById(containerId);
    if (!sb) return;
    sb.innerHTML = '';
    const sorted = countryKeys.map(key => ({ key, score: state.scores[key] || 0, c: QUESTIONS_DB[key] }))
        .sort((a, b) => b.score - a.score || a.c.name.localeCompare(b.c.name));
    sorted.forEach((e, idx) => {
        const rank = idx + 1;
        const item = document.createElement('div'); item.className = 'sb-item';
        if (e.score > 0 && rank <= 3) item.classList.add(`rank-${rank}`);
        if (highlightKey === e.key) item.classList.add('highlight');
        if (state.myCountryLeft === e.key || state.myCountryRight === e.key) item.classList.add('my-team');
        const sc = e.score === 0 ? 'sb-score sb-score-zero' : 'sb-score';
        item.innerHTML = `<span class="sb-rank">${rank}</span><img src="${e.c.flagImg}" alt="${e.c.name}" class="sb-flag"><span class="sb-name">${e.c.name}</span><span class="${sc}">${e.score}</span>`;
        sb.appendChild(item);
    });
}

function renderAllScoreboards(highlight) {
    ['scoreboardMesa', 'scoreboardAssign', 'scoreboardBuzzer', 'scoreboardBoard'].forEach(id => {
        renderScoreboard(id, highlight);
    });
}

// ===== WELCOME FLAGS =====
function buildWelcomeFlags() {
    const box = document.getElementById('welcomeFlags'); box.innerHTML = '';
    countryKeys.forEach(key => {
        const img = document.createElement('img'); img.src = QUESTIONS_DB[key].flagImg; img.alt = QUESTIONS_DB[key].name;
        box.appendChild(img);
    });
}

// ===== MESA SELECTION =====
function updateMesaCards() {
    for (let i = 1; i <= 5; i++) {
        const card = document.querySelector(`.mesa-card[data-mesa="${i}"]`);
        const countriesEl = document.getElementById(`mesaCountries${i}`);
        const mesaData = state.mesas[`mesa${i}`];

        card.classList.remove('taken', 'mine', 'ready');

        if (mesaData && mesaData.countries) {
            const c1 = QUESTIONS_DB[mesaData.countries[0]];
            const c2 = QUESTIONS_DB[mesaData.countries[1]];
            countriesEl.innerHTML = `
                <div class="mesa-countries-flags">
                    <img src="${c1.flagImg}" alt="${c1.name}">
                    <span>${c1.name}</span>
                    <span style="color:var(--txt3)">vs</span>
                    <img src="${c2.flagImg}" alt="${c2.name}">
                    <span>${c2.name}</span>
                </div>`;
            if (state.myMesa === i) {
                card.classList.add('mine');
            } else {
                // Show as ready to join, not blocked
                card.classList.add('ready');
            }
        } else {
            countriesEl.textContent = 'Disponible — clic para elegir';
        }
    }
}

function onMesaClick(mesaNum) {
    initAudio(); playSound('click');
    const mesaData = state.mesas[`mesa${mesaNum}`];

    // If already my mesa and I have a role, resume
    if (state.myMesa === mesaNum && state.role) {
        if (state.role === 'host') { listenToMyMesaCells(); goToBuzzer(); }
        else { startPlayerMode(); }
        return;
    }

    // If mesa has countries, go to role selection
    if (mesaData && mesaData.countries) {
        state.myMesa = mesaNum;
        state.myCountryLeft = mesaData.countries[0];
        state.myCountryRight = mesaData.countries[1];
        listenToMyMesaCells();
        saveSession();
        showRoleSelection();
        return;
    }

    // Empty mesa — go to assign screen
    state.myMesa = mesaNum;
    state.myCountryLeft = null;
    state.myCountryRight = null;
    document.getElementById('assignTitle').textContent = `MESA ${mesaNum} — Elige 2 países`;
    updateAssignUI();
    showScreen('assign');
}

// ===== ROLE SELECTION =====
function showRoleSelection() {
    const left = QUESTIONS_DB[state.myCountryLeft];
    const right = QUESTIONS_DB[state.myCountryRight];
    document.getElementById('roleSubtitle').textContent = `Mesa ${state.myMesa} — ${left.name} vs ${right.name}`;
    document.getElementById('roleFlagLeft').src = left.flagImg;
    document.getElementById('roleNameLeft').textContent = left.name;
    document.getElementById('roleFlagRight').src = right.flagImg;
    document.getElementById('roleNameRight').textContent = right.name;
    renderScoreboard('scoreboardRole');
    showScreen('role');
}

function selectRole(role) {
    initAudio(); playSound('click');
    state.role = role;
    saveSession();
    if (role === 'host') {
        goToBuzzer();
    } else {
        startPlayerMode();
    }
}

// ===== PLAYER MODE =====
function startPlayerMode() {
    const left = QUESTIONS_DB[state.myCountryLeft];
    const right = QUESTIONS_DB[state.myCountryRight];
    const mySide = state.role === 'playerLeft' ? 'left' : 'right';
    const myData = mySide === 'left' ? left : right;
    const rivalData = mySide === 'left' ? right : left;
    
    document.getElementById('pbMyFlag').src = myData.flagImg;
    document.getElementById('pbMyName').textContent = myData.name;
    document.getElementById('pbRivalFlag').src = rivalData.flagImg;
    document.getElementById('pbRivalName').textContent = rivalData.name;
    
    updatePlayerScores();
    showScreen('playerBuzzer');
    listenToBuzzerSync();
    listenToQuestionSync();
}

function updatePlayerScores() {
    const leftScore = state.scores[state.myCountryLeft] || 0;
    const rightScore = state.scores[state.myCountryRight] || 0;
    document.getElementById('pbScoreLeft').textContent = leftScore;
    document.getElementById('pbScoreRight').textContent = rightScore;
}

// ===== BUZZER SYNC =====
function activateBuzzerForPlayers() {
    if (state.role !== 'host' || !state.myMesa) return;
    GAME_REF.child(`buzzer/mesa${state.myMesa}`).set({
        active: true,
        winner: null
    });
}

function deactivateBuzzerForPlayers() {
    if (state.role !== 'host' || !state.myMesa) return;
    GAME_REF.child(`buzzer/mesa${state.myMesa}`).set({ active: false, winner: null });
}

function listenToBuzzerSync() {
    if (buzzerSyncRef) buzzerSyncRef.off();
    buzzerSyncRef = GAME_REF.child(`buzzer/mesa${state.myMesa}`);
    buzzerSyncRef.on('value', snap => {
        const data = snap.val();
        if (!data) return;
        const buzzBtn = document.getElementById('pbBuzzBtn');
        const statusEl = document.getElementById('pbStatus');
        const hintEl = document.getElementById('pbHint');

        if (state.role === 'host') {
            // Host: listen for winner from phone buzzer
            if (data.winner && data.active) {
                state.buzzerWinner = data.winner === 'left' ? state.myCountryLeft : state.myCountryRight;
                playSound('buzz');
                goToBoard();
            }
            return;
        }

        // Player mode
        if (!data.active) {
            buzzBtn.disabled = true;
            buzzBtn.classList.remove('active-buzz', 'won', 'lost');
            statusEl.textContent = '⏳ Esperando ronda...';
            statusEl.classList.remove('winner', 'loser');
            hintEl.textContent = 'El host activará el buzzer';
            state.buzzerPressed = false;
            return;
        }

        if (data.winner) {
            const mySide = state.role === 'playerLeft' ? 'left' : 'right';
            buzzBtn.disabled = true;
            if (data.winner === mySide) {
                buzzBtn.classList.remove('active-buzz', 'lost');
                buzzBtn.classList.add('won');
                statusEl.textContent = '🏆 ¡GANASTE EL TURNO!';
                statusEl.classList.add('winner');
                statusEl.classList.remove('loser');
                hintEl.textContent = 'Espera la pregunta...';
                playSound('correct');
            } else {
                buzzBtn.classList.remove('active-buzz', 'won');
                buzzBtn.classList.add('lost');
                statusEl.textContent = '😔 Tarde...';
                statusEl.classList.add('loser');
                statusEl.classList.remove('winner');
                hintEl.textContent = 'Tu rival fue más rápido';
                playSound('wrong');
            }
            return;
        }

        // Active buzzer, no winner yet — enable button
        if (!state.buzzerPressed) {
            buzzBtn.disabled = false;
            buzzBtn.classList.remove('won', 'lost');
            buzzBtn.classList.add('active-buzz');
            statusEl.textContent = '¡PRESIONA!';
            statusEl.classList.remove('winner', 'loser');
            hintEl.textContent = '¡Sé el primero!';
        }
    });
}

function playerPressBuzzer() {
    if (state.buzzerPressed) return;
    state.buzzerPressed = true;
    initAudio(); playSound('buzz');
    const mySide = state.role === 'playerLeft' ? 'left' : 'right';
    
    document.getElementById('pbBuzzBtn').disabled = true;
    document.getElementById('pbStatus').textContent = '⏳ Verificando...';
    
    // Atomic transaction: first to set winner wins
    GAME_REF.child(`buzzer/mesa${state.myMesa}/winner`).transaction(current => {
        if (current !== null) return; // someone already won, don't overwrite
        return mySide;
    });
}

// ===== QUESTION SYNC (for players) =====
function syncQuestionToPlayers(catKey, rowIdx, question, pts, answeredBy) {
    if (state.role !== 'host' || !state.myMesa) return;
    const answererData = QUESTIONS_DB[answeredBy];
    GAME_REF.child(`currentQuestion/mesa${state.myMesa}`).set({
        catKey: catKey,
        q: question.q,
        options: question.options,
        pts: pts,
        answeredBy: answeredBy,
        answeredByName: answererData ? answererData.name : '',
        answeredByFlag: answererData ? answererData.flagImg : '',
        correctIdx: question.answer,
        answered: false,
        selectedIdx: null,
        showResult: false
    });
}

function syncAnswerToPlayers(selectedIdx, isCorrect) {
    if (state.role !== 'host' || !state.myMesa) return;
    GAME_REF.child(`currentQuestion/mesa${state.myMesa}`).update({
        answered: true,
        selectedIdx: selectedIdx,
        showResult: true,
        isCorrect: isCorrect
    });
}

function syncQuestionDone() {
    if (state.role !== 'host' || !state.myMesa) return;
    GAME_REF.child(`currentQuestion/mesa${state.myMesa}`).set(null);
}

function listenToQuestionSync() {
    if (questionSyncRef) questionSyncRef.off();
    if (state.role === 'host') return; // host doesn't need to listen
    questionSyncRef = GAME_REF.child(`currentQuestion/mesa${state.myMesa}`);
    questionSyncRef.on('value', snap => {
        const data = snap.val();
        if (!data) {
            // No active question, show buzzer screen
            if (screens.playerQuestion.classList.contains('active')) {
                updatePlayerScores();
                showScreen('playerBuzzer');
            }
            return;
        }

        // Show question on player screen
        const catData = QUESTIONS_DB[data.catKey];
        document.getElementById('pqCatFlag').src = catData ? catData.flagImg : '';
        document.getElementById('pqCatName').textContent = catData ? catData.name : data.catKey;
        document.getElementById('pqPts').textContent = `${data.pts} PTS`;
        document.getElementById('pqWhoFlag').src = data.answeredByFlag || '';
        document.getElementById('pqWhoName').textContent = data.answeredByName || '';
        document.getElementById('pqText').textContent = data.q;
        
        // Options
        const letters = ['A', 'B', 'C', 'D'];
        for (let i = 0; i < 4; i++) {
            const opt = document.getElementById(`pqOpt${i}`);
            opt.querySelector('.pq-ol').textContent = letters[i];
            opt.querySelector('.pq-ot').textContent = data.options[i];
            opt.classList.remove('ok', 'bad');
            if (data.showResult && data.answered) {
                if (i === data.correctIdx) opt.classList.add('ok');
                else if (i === data.selectedIdx && data.selectedIdx !== data.correctIdx) opt.classList.add('bad');
            }
        }

        const resultEl = document.getElementById('pqResult');
        if (data.showResult) {
            resultEl.style.display = 'block';
            if (data.isCorrect) {
                resultEl.textContent = `✅ ¡CORRECTO! +${data.pts} pts`;
                resultEl.className = 'pq-result correct';
            } else {
                resultEl.textContent = `❌ INCORRECTO`;
                resultEl.className = 'pq-result wrong';
            }
        } else {
            resultEl.style.display = 'none';
        }

        showScreen('playerQuestion');
    });
}

// ===== ASSIGN COUNTRIES =====
function getUsedCountries() {
    const used = new Set();
    Object.values(state.mesas).forEach(mesa => {
        if (mesa && mesa.countries) {
            mesa.countries.forEach(c => used.add(c));
        }
    });
    return used;
}

function closeAllDropdowns() {
    document.getElementById('apDropLeft').classList.remove('open');
    document.getElementById('apDropRight').classList.remove('open');
    state.dropdownOpen = null;
}

function toggleDropdown(side) {
    const dropId = side === 'left' ? 'apDropLeft' : 'apDropRight';
    const drop = document.getElementById(dropId);
    if (drop.classList.contains('open')) { closeAllDropdowns(); }
    else { closeAllDropdowns(); buildDropdown(side); drop.classList.add('open'); state.dropdownOpen = side; }
}

function buildDropdown(side) {
    const dropId = side === 'left' ? 'apDropLeft' : 'apDropRight';
    const otherKey = side === 'left' ? state.myCountryRight : state.myCountryLeft;
    const usedByOtherMesas = getUsedCountries();
    const drop = document.getElementById(dropId); drop.innerHTML = '';
    countryKeys.forEach(key => {
        const c = QUESTIONS_DB[key];
        const btn = document.createElement('button'); btn.className = 'ap-dd-item';
        if (key === otherKey || usedByOtherMesas.has(key)) btn.classList.add('taken');
        btn.innerHTML = `<img src="${c.flagImg}" alt="${c.name}"><span>${c.name}</span>`;
        btn.addEventListener('click', () => { selectCountry(side, key); closeAllDropdowns(); });
        drop.appendChild(btn);
    });
}

function selectCountry(side, key) {
    initAudio(); playSound('select');
    if (side === 'left') state.myCountryLeft = key; else state.myCountryRight = key;
    updateAssignUI();
}

function updateAssignUI() {
    if (state.myCountryLeft) {
        const c = QUESTIONS_DB[state.myCountryLeft];
        document.getElementById('apPickLeft').style.display = 'none';
        document.getElementById('apSelectedLeft').style.display = 'flex';
        document.getElementById('apFlagLeft').src = c.flagImg;
        document.getElementById('apNameLeft').textContent = c.name;
    } else {
        document.getElementById('apPickLeft').style.display = 'block';
        document.getElementById('apSelectedLeft').style.display = 'none';
    }
    if (state.myCountryRight) {
        const c = QUESTIONS_DB[state.myCountryRight];
        document.getElementById('apPickRight').style.display = 'none';
        document.getElementById('apSelectedRight').style.display = 'flex';
        document.getElementById('apFlagRight').src = c.flagImg;
        document.getElementById('apNameRight').textContent = c.name;
    } else {
        document.getElementById('apPickRight').style.display = 'block';
        document.getElementById('apSelectedRight').style.display = 'none';
    }
    document.getElementById('confirmMesaBtn').disabled = !(state.myCountryLeft && state.myCountryRight);
}

// FIX 3: Atomic reservation using Firebase transaction
function confirmMesa() {
    initAudio(); playSound('buzzer');
    const mesaKey = `mesa${state.myMesa}`;
    const leftKey = state.myCountryLeft;
    const rightKey = state.myCountryRight;

    // Use transaction to atomically claim the mesa + verify countries aren't taken
    GAME_REF.child('mesas').transaction(currentMesas => {
        if (currentMesas === null) currentMesas = {};

        // Check if this mesa is already taken by someone else
        if (currentMesas[mesaKey] && currentMesas[mesaKey].countries) {
            return; // abort — mesa already claimed
        }

        // Check if either country is already used by another mesa
        for (const key of Object.keys(currentMesas)) {
            if (key === mesaKey) continue;
            const mesa = currentMesas[key];
            if (mesa && mesa.countries) {
                if (mesa.countries.includes(leftKey) || mesa.countries.includes(rightKey)) {
                    return; // abort — country already taken
                }
            }
        }

        // All clear — claim the mesa
        currentMesas[mesaKey] = { countries: [leftKey, rightKey] };
        return currentMesas;
    }, (error, committed) => {
        if (error) {
            alert('❌ Error de conexión. Intenta de nuevo.');
            return;
        }
        if (!committed) {
            alert('⚠️ Esos países ya fueron tomados por otra mesa. Elige otros.');
            state.myCountryLeft = null;
            state.myCountryRight = null;
            updateAssignUI();
            return;
        }
        // Success!
        listenToMyMesaCells();
        saveSession(); // FIX 1: persist session
        showRoleSelection();
    });
}

// ===== BUZZER =====
function goToBuzzer() {
    state.role = state.role || 'host';
    const leftC = QUESTIONS_DB[state.myCountryLeft];
    const rightC = QUESTIONS_DB[state.myCountryRight];
    document.getElementById('buzzFlag1').src = leftC.flagImg;
    document.getElementById('buzzName1').textContent = leftC.name;
    document.getElementById('buzzFlag2').src = rightC.flagImg;
    document.getElementById('buzzName2').textContent = rightC.name;
    renderAllScoreboards();
    showScreen('buzzer');
    // Activate buzzer for phone players
    activateBuzzerForPlayers();
    listenToBuzzerSync();
}

function goToBoard() {
    const winner = QUESTIONS_DB[state.buzzerWinner];
    document.getElementById('bwFlag').src = winner.flagImg;
    document.getElementById('bwName').textContent = winner.name;
    buildGrid();
    renderAllScoreboards(state.buzzerWinner);
    deactivateBuzzerForPlayers();
    showScreen('board');
}

function onBuzz(side) {
    initAudio(); playSound('select');
    state.buzzerWinner = side === 'left' ? state.myCountryLeft : state.myCountryRight;
    goToBoard();
}

// ===== JEOPARDY GRID =====
function buildGrid() {
    const grid = document.getElementById('jeopardyGrid'); grid.innerHTML = '';
    countryKeys.forEach(key => {
        const c = QUESTIONS_DB[key];
        const hdr = document.createElement('div'); hdr.className = 'jg-hdr';
        hdr.innerHTML = `<img src="${c.flagImg}" alt="${c.name}"><span>${c.name}</span>`;
        grid.appendChild(hdr);
    });
    POINT_VALUES.forEach((pts, rowIdx) => {
        countryKeys.forEach(key => {
            const cellKey = `${key}_${rowIdx}`;
            const cell = document.createElement('div'); cell.className = 'jg-cell';
            if (state.usedCells[cellKey]) { cell.classList.add('used'); cell.textContent = '✓'; }
            else { cell.textContent = pts; cell.addEventListener('click', () => onCellClick(key, rowIdx)); }
            grid.appendChild(cell);
        });
    });
}

// ===== CELL CLICK → QUESTION =====
function onCellClick(catKey, rowIdx) {
    initAudio(); playSound('select');
    state.currentCategory = catKey;
    state.currentRow = rowIdx;
    state.answered = false;

    const catCountry = QUESTIONS_DB[catKey];
    const ansCountry = QUESTIONS_DB[state.buzzerWinner];
    const question = catCountry.questions[rowIdx];
    const pts = POINT_VALUES[rowIdx];

    document.getElementById('qCatFlag').src = catCountry.flagImg;
    document.getElementById('qCatName').textContent = catCountry.name;
    document.getElementById('qAnsFlag').src = ansCountry.flagImg;
    document.getElementById('qAnsName').textContent = ansCountry.name;
    document.getElementById('qPtsBadge').textContent = pts + ' PTS';
    document.getElementById('qText').textContent = question.q;

    const letters = ['A', 'B', 'C', 'D'];
    const opts = document.getElementById('qOptions').querySelectorAll('.q-opt');
    opts.forEach((btn, i) => {
        btn.className = 'q-opt';
        btn.querySelector('.q-ol').textContent = letters[i];
        btn.querySelector('.q-ot').textContent = question.options[i];
        btn.onclick = () => onAnswer(i);
    });

    document.getElementById('qActions').style.display = 'none';

    // FIX 7: Variable timer based on point row
    state.timerMax = TIMER_BY_POINTS[rowIdx] || 30;
    startTimer();
    // Sync question to player phones
    syncQuestionToPlayers(catKey, rowIdx, question, pts, state.buzzerWinner);
    showScreen('question');
}

// ===== TIMER =====
function startTimer() {
    clearInterval(state.timer);
    state.timerValue = state.timerMax;
    document.getElementById('timerFill').style.width = '100%';
    document.getElementById('timerFill').classList.remove('warn');
    state.timer = setInterval(() => {
        state.timerValue--;
        document.getElementById('timerFill').style.width = ((state.timerValue / state.timerMax) * 100) + '%';
        if (state.timerValue <= 10) {
            document.getElementById('timerFill').classList.add('warn');
            if (state.timerValue > 0 && state.timerValue <= 5) playSound('tick');
        }
        if (state.timerValue <= 0) { clearInterval(state.timer); if (!state.answered) timeUp(); }
    }, 1000);
}
function stopTimer() { clearInterval(state.timer); }

function timeUp() {
    state.answered = true; playSound('incorrect');
    markCellUsed();
    const q = QUESTIONS_DB[state.currentCategory].questions[state.currentRow];
    const opts = document.getElementById('qOptions').querySelectorAll('.q-opt');
    opts.forEach((btn, i) => { btn.classList.add('dis'); if (i === q.answer) btn.classList.add('ok'); });
    document.body.classList.add('flash-bad');
    setTimeout(() => document.body.classList.remove('flash-bad'), 300);
    document.getElementById('qActions').style.display = 'flex';
    syncAnswerToPlayers(-1, false);
}

// ===== ANSWER =====
function onAnswer(idx) {
    if (state.answered) return;
    state.answered = true; stopTimer();
    const q = QUESTIONS_DB[state.currentCategory].questions[state.currentRow];
    const isCorrect = idx === q.answer;
    const pts = POINT_VALUES[state.currentRow];
    markCellUsed();
    const opts = document.getElementById('qOptions').querySelectorAll('.q-opt');
    opts.forEach((btn, i) => {
        btn.classList.add('dis');
        if (i === q.answer) btn.classList.add('ok');
        if (i === idx && !isCorrect) btn.classList.add('bad');
    });
    if (isCorrect) {
        playSound('correct');
        GAME_REF.child(`scores/${state.buzzerWinner}`).transaction(current => (current || 0) + pts);
        document.body.classList.add('flash-ok');
        setTimeout(() => document.body.classList.remove('flash-ok'), 300);
    } else {
        playSound('incorrect');
        document.body.classList.add('flash-bad');
        setTimeout(() => document.body.classList.remove('flash-bad'), 300);
    }
    document.getElementById('qActions').style.display = 'flex';
    // Sync answer to player phones
    syncAnswerToPlayers(idx, isCorrect);
}

function markCellUsed() {
    const cellKey = `${state.currentCategory}_${state.currentRow}`;
    state.usedCells[cellKey] = true;
    GAME_REF.child(`usedCells/mesa${state.myMesa}/${cellKey}`).set(true);
}

// ===== BACK TO BUZZER =====
function goToNextRound() {
    playSound('click'); stopTimer();
    state.buzzerWinner = null;
    syncQuestionDone();
    goToBuzzer();
}

// FIX 2: Back from board to buzzer
function boardBackToBuzzer() {
    playSound('click');
    state.buzzerWinner = null;
    goToBuzzer();
}

// FIX 2: Back from buzzer to mesa selection
function buzzerBackToMesas() {
    playSound('click');
    // Don't release mesa — just go back to see it
    renderAllScoreboards();
    showScreen('mesa');
}

// ===== RESULTS =====
function showResults() {
    // FIX 6: Check minimum questions
    if (state.questionsAnswered < MIN_QUESTIONS_FOR_RESULTS) {
        alert(`⚠️ Necesitas responder al menos ${MIN_QUESTIONS_FOR_RESULTS} preguntas antes de ver los resultados. Llevas ${state.questionsAnswered}.`);
        return;
    }
    if (!confirm('¿Ver resultados finales?')) return;

    playSound('victory'); launchConfetti();
    const podium = document.getElementById('resPodium'); podium.innerHTML = '';
    const sorted = countryKeys.map(key => ({ key, score: state.scores[key] || 0, c: QUESTIONS_DB[key] }))
        .sort((a, b) => b.score - a.score);
    const medals = ['🥇', '🥈', '🥉'];
    sorted.forEach((e, idx) => {
        const row = document.createElement('div'); row.className = 'rp-row';
        const sc = e.score === 0 ? 'rp-sc rp-sc-zero' : 'rp-sc';
        row.innerHTML = `<span class="rp-medal">${idx < 3 ? medals[idx] : (idx + 1)}</span><img src="${e.c.flagImg}" alt="${e.c.name}" class="rp-flag"><span class="rp-name">${e.c.name}</span><span class="${sc}">${e.score}</span>`;
        podium.appendChild(row);
    });
    showScreen('result');
}

// ===== FIX 5: Smart reset (doesn't delete usedCells) =====
function fullReset() {
    if (!confirm('¿Volver al inicio? (Libera tu mesa)')) return;

    // Release mesa assignment but keep usedCells & scores intact
    if (state.myMesa) {
        GAME_REF.child(`mesas/mesa${state.myMesa}`).remove();
        // NOTE: usedCells are NOT deleted - progress preserved
    }

    // FIX 4: Clean up listeners
    if (mesaCellsRef) { mesaCellsRef.off(); mesaCellsRef = null; }

    state.myMesa = null; state.myCountryLeft = null; state.myCountryRight = null;
    state.buzzerWinner = null; state.currentCategory = null; state.currentRow = null;
    state.answered = false; state.usedCells = {}; state.questionsAnswered = 0;
    stopTimer();
    clearSession(); // FIX 1
    showScreen('welcome');
}

// ===== FIX 6: Admin panel =====
function openAdmin() {
    const pw = prompt('🔐 Contraseña de administrador:');
    if (pw !== ADMIN_PASSWORD) {
        if (pw !== null) alert('❌ Contraseña incorrecta');
        return;
    }
    document.getElementById('adminPanel').style.display = 'flex';
}

function closeAdmin() {
    document.getElementById('adminPanel').style.display = 'none';
}

function adminResetScores() {
    if (!confirm('⚠️ Esto pondrá TODOS los scores en 0 en TODAS las pantallas. ¿Continuar?')) return;
    const init = {};
    countryKeys.forEach(key => { init[key] = 0; });
    GAME_REF.child('scores').set(init);
    alert('✅ Todos los scores se han reseteado a 0');
}

function adminResetMesas() {
    if (!confirm('⚠️ Esto liberará TODAS las mesas en TODAS las pantallas. ¿Continuar?')) return;
    GAME_REF.child('mesas').remove();
    GAME_REF.child('usedCells').remove();
    alert('✅ Todas las mesas y progreso han sido liberados');
}

function adminResetAll() {
    if (!confirm('💣 Esto borrará TODO: scores, mesas, progreso. ¿Estás seguro?')) return;
    if (!confirm('⚠️ ¿REALMENTE seguro? No hay vuelta atrás.')) return;
    const init = {};
    countryKeys.forEach(key => { init[key] = 0; });
    GAME_REF.set({ scores: init });
    clearSession();
    alert('✅ Todo ha sido reseteado');
    location.reload();
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initParticles(); buildWelcomeFlags();

    // Init Firebase
    initScoresInFirebase();
    initFirebaseListeners();

    // FIX 1: Try to restore previous session
    const restored = tryRestoreSession();
    // If not restored, show welcome as usual

    // Welcome → Mesa selection
    document.getElementById('startBtn').addEventListener('click', () => {
        initAudio(); playSound('click');
        renderAllScoreboards();
        showScreen('mesa');
    });

    // Mesa cards
    document.querySelectorAll('.mesa-card').forEach(card => {
        card.addEventListener('click', () => {
            const mesaNum = parseInt(card.dataset.mesa);
            onMesaClick(mesaNum);
        });
    });

    // Assign country dropdowns
    document.getElementById('apPickLeft').addEventListener('click', () => toggleDropdown('left'));
    document.getElementById('apPickRight').addEventListener('click', () => toggleDropdown('right'));
    document.getElementById('apChangeLeft').addEventListener('click', () => {
        state.myCountryLeft = null; updateAssignUI(); toggleDropdown('left');
    });
    document.getElementById('apChangeRight').addEventListener('click', () => {
        state.myCountryRight = null; updateAssignUI(); toggleDropdown('right');
    });
    document.addEventListener('click', (e) => {
        if (state.dropdownOpen && !e.target.closest('.ap-side')) closeAllDropdowns();
    });

    // Confirm mesa
    document.getElementById('confirmMesaBtn').addEventListener('click', confirmMesa);
    document.getElementById('backToMesas').addEventListener('click', () => {
        playSound('click'); state.myMesa = null; showScreen('mesa');
    });

    // FIX 2: Buzzer back to mesas
    document.getElementById('buzzerBackToMesas').addEventListener('click', buzzerBackToMesas);

    // Buzzer buttons (host manual override)
    document.getElementById('buzzTeam1').addEventListener('click', () => onBuzz('left'));
    document.getElementById('buzzTeam2').addEventListener('click', () => onBuzz('right'));

    // Role selection
    document.getElementById('rolePlayerLeft').addEventListener('click', () => selectRole('playerLeft'));
    document.getElementById('rolePlayerRight').addEventListener('click', () => selectRole('playerRight'));
    document.getElementById('roleHost').addEventListener('click', () => selectRole('host'));
    document.getElementById('roleBackToMesas').addEventListener('click', () => {
        playSound('click'); state.role = null; showScreen('mesa');
    });

    // Player buzzer button
    document.getElementById('pbBuzzBtn').addEventListener('click', playerPressBuzzer);

    // FIX 2: Board back to buzzer
    document.getElementById('boardBackToBuzzer').addEventListener('click', boardBackToBuzzer);

    // Back to buzzer from question
    document.getElementById('backToBuzzer').addEventListener('click', goToNextRound);

    // FIX 6: End game with minimum check
    document.getElementById('endGameBtn').addEventListener('click', showResults);

    // Restart (FIX 5: smart reset)
    document.getElementById('restartBtn').addEventListener('click', fullReset);

    // FIX 6: Admin panel — triple click on logo
    let logoClicks = 0;
    let logoTimer = null;
    document.getElementById('logoContainer').addEventListener('click', () => {
        logoClicks++;
        clearTimeout(logoTimer);
        if (logoClicks >= 3) {
            logoClicks = 0;
            openAdmin();
        }
        logoTimer = setTimeout(() => { logoClicks = 0; }, 800);
    });

    // Admin panel buttons
    document.getElementById('adminResetScores').addEventListener('click', adminResetScores);
    document.getElementById('adminResetMesas').addEventListener('click', adminResetMesas);
    document.getElementById('adminResetAll').addEventListener('click', adminResetAll);
    document.getElementById('adminClose').addEventListener('click', closeAdmin);

    // Floating admin button — created dynamically for reliability
    const fab = document.createElement('button');
    fab.id = 'floatingAdminBtn';
    fab.textContent = '⚙️';
    fab.title = 'Panel Admin';
    fab.addEventListener('click', openAdmin);
    document.body.appendChild(fab);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Admin shortcut: Ctrl+Alt+A from ANY screen
        if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            openAdmin();
            return;
        }
        if (screens.buzzer.classList.contains('active')) {
            if (e.key === '1' || e.key === 'ArrowLeft') onBuzz('left');
            else if (e.key === '2' || e.key === 'ArrowRight') onBuzz('right');
        }
        if (screens.question.classList.contains('active') && !state.answered) {
            if (e.key.toLowerCase() === 'a' || e.key === '1') onAnswer(0);
            else if (e.key.toLowerCase() === 'b' || e.key === '2') onAnswer(1);
            else if (e.key.toLowerCase() === 'c' || e.key === '3') onAnswer(2);
            else if (e.key.toLowerCase() === 'd' || e.key === '4') onAnswer(3);
        }
        if (screens.question.classList.contains('active') && state.answered) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goToNextRound(); }
        }
    });
});
