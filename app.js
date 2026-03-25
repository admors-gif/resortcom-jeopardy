// ============================================================
// RESORTCOM GDL - TRIVIA MUNDIAL v3
// Torneo: todos pasan, podium global visible siempre
// ============================================================

// ===== STATE =====
const state = {
    // Global scoreboard: { countryKey: { teamName, score, questionsUsed: [] } }
    globalScores: {},
    // Current matchup
    team1Country: null,
    team2Country: null,
    currentTeam: null,   // 0 or 1
    currentQuestionIndex: 0,
    answered: false,
    timer: null,
    timerValue: 30,
    timerMax: 30
};

// ===== DOM =====
const screens = {
    setup: document.getElementById('setupScreen'),
    game: document.getElementById('gameScreen'),
    question: document.getElementById('questionScreen'),
    result: document.getElementById('resultScreen')
};

// ===== AUDIO =====
let audioCtx = null;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    if (type === 'correct') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'incorrect') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, audioCtx.currentTime);
        osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.4);
    } else if (type === 'click') {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'buzzer') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'victory') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g); g.connect(audioCtx.destination);
            o.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
            g.gain.setValueAtTime(0.25, audioCtx.currentTime + i * 0.15);
            g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.15 + 0.3);
            o.start(audioCtx.currentTime + i * 0.15);
            o.stop(audioCtx.currentTime + i * 0.15 + 0.3);
        });
    } else if (type === 'tick') {
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.05);
    }
}

// ===== SCREEN NAV =====
function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

// ===== PARTICLES =====
function initParticles() {
    const canvas = document.getElementById('particlesCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const colors = ['#E63946', '#2ECC71', '#3498DB', '#F1C40F'];
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize(); window.addEventListener('resize', resize);
    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1; this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.opacity = Math.random() * 0.5 + 0.1;
        }
        update() {
            this.x += this.speedX; this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }
        draw() {
            ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = this.color; ctx.globalAlpha = this.opacity; ctx.fill(); ctx.globalAlpha = 1;
        }
    }
    for (let i = 0; i < 80; i++) particles.push(new Particle());
    function drawConnections() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = particles[i].color;
                    ctx.globalAlpha = 0.05 * (1 - dist / 150);
                    ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
                }
            }
        }
    }
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        drawConnections(); requestAnimationFrame(animate);
    }
    animate();
}

// ===== CONFETTI =====
function launchConfetti() {
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';
    const colors = ['#E63946', '#2ECC71', '#3498DB', '#F1C40F', '#FF6B6B', '#55E89D', '#5DADE2', '#F7DC6F'];
    for (let i = 0; i < 100; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.width = (Math.random() * 12 + 5) + 'px';
        piece.style.height = (Math.random() * 12 + 5) + 'px';
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
        piece.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(piece);
    }
    setTimeout(() => { container.innerHTML = ''; }, 5000);
}

// ===== INIT GLOBAL SCORES =====
function initGlobalScores() {
    Object.keys(QUESTIONS_DB).forEach(key => {
        if (!state.globalScores[key]) {
            state.globalScores[key] = {
                teamName: '',
                score: 0,
                questionsUsed: []
            };
        }
    });
}

// ===== RENDER PODIUM =====
function renderPodium(containerId, highlightKeys) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    // Sort: score desc, then by name
    const sorted = Object.keys(state.globalScores).map(key => ({
        key,
        ...state.globalScores[key],
        country: QUESTIONS_DB[key]
    })).sort((a, b) => b.score - a.score || a.country.name.localeCompare(b.country.name));

    sorted.forEach((entry, idx) => {
        const rank = idx + 1;
        const row = document.createElement('div');
        row.className = 'podium-row';
        if (rank <= 3 && entry.score > 0) row.classList.add(`rank-${rank}`);
        if (highlightKeys && highlightKeys.includes(entry.key)) row.classList.add('highlight');

        const displayName = entry.teamName || entry.country.name;
        const qUsed = entry.questionsUsed.length;
        const qTotal = entry.country.questions.length;
        const scoreClass = entry.score === 0 ? 'podium-score podium-score-zero' : 'podium-score';

        row.innerHTML = `
            <div class="podium-rank">${rank}</div>
            <img src="${entry.country.flagImg}" alt="${entry.country.name}" class="podium-flag">
            <div class="podium-info">
                <span class="podium-team-name">${displayName}</span>
                <span class="podium-country-name">${entry.country.name}</span>
            </div>
            <span class="${scoreClass}">${entry.score}</span>
            <span class="podium-questions">${qUsed}/${qTotal}</span>
        `;
        container.appendChild(row);
    });
}

// ===== BUILD COUNTRY SELECTORS =====
function buildCountrySelectors() {
    const c1 = document.getElementById('team1Countries');
    const c2 = document.getElementById('team2Countries');
    c1.innerHTML = '';
    c2.innerHTML = '';

    Object.keys(QUESTIONS_DB).forEach(key => {
        const country = QUESTIONS_DB[key];

        const btn1 = document.createElement('button');
        btn1.className = 'ts-country-btn';
        btn1.dataset.country = key;
        btn1.innerHTML = `<img src="${country.flagImg}" alt="${country.name}"><span>${country.name}</span>`;
        btn1.addEventListener('click', () => selectCountry(1, key));
        c1.appendChild(btn1);

        const btn2 = document.createElement('button');
        btn2.className = 'ts-country-btn';
        btn2.dataset.country = key;
        btn2.innerHTML = `<img src="${country.flagImg}" alt="${country.name}"><span>${country.name}</span>`;
        btn2.addEventListener('click', () => selectCountry(2, key));
        c2.appendChild(btn2);
    });
}

function selectCountry(team, key) {
    initAudio(); playSound('click');
    if (team === 1) state.team1Country = key;
    else state.team2Country = key;
    updateSelectionUI();
}

function updateSelectionUI() {
    // Team 1 buttons
    document.querySelectorAll('#team1Countries .ts-country-btn').forEach(btn => {
        btn.className = 'ts-country-btn';
        if (btn.dataset.country === state.team1Country) btn.classList.add('sel-1');
        if (btn.dataset.country === state.team2Country) btn.classList.add('taken');
    });
    // Team 2 buttons
    document.querySelectorAll('#team2Countries .ts-country-btn').forEach(btn => {
        btn.className = 'ts-country-btn';
        if (btn.dataset.country === state.team2Country) btn.classList.add('sel-2');
        if (btn.dataset.country === state.team1Country) btn.classList.add('taken');
    });
    // Start button
    document.getElementById('startGameBtn').disabled = !(state.team1Country && state.team2Country);
}

// ===== START ROUND =====
function startRound() {
    playSound('click');

    const t1Name = document.getElementById('team1Name').value.trim() || QUESTIONS_DB[state.team1Country].name;
    const t2Name = document.getElementById('team2Name').value.trim() || QUESTIONS_DB[state.team2Country].name;

    // Register team names in global scores
    state.globalScores[state.team1Country].teamName = t1Name;
    state.globalScores[state.team2Country].teamName = t2Name;

    const c1 = QUESTIONS_DB[state.team1Country];
    const c2 = QUESTIONS_DB[state.team2Country];

    // Game screen
    document.getElementById('gameFlag1').src = c1.flagImg;
    document.getElementById('gameFlag2').src = c2.flagImg;
    document.getElementById('gameTeamName1').textContent = t1Name;
    document.getElementById('gameTeamName2').textContent = t2Name;
    document.getElementById('gameCountryName1').textContent = c1.name;
    document.getElementById('gameCountryName2').textContent = c2.name;
    document.getElementById('gameScore1').textContent = state.globalScores[state.team1Country].score;
    document.getElementById('gameScore2').textContent = state.globalScores[state.team2Country].score;

    const left1 = c1.questions.length - state.globalScores[state.team1Country].questionsUsed.length;
    const left2 = c2.questions.length - state.globalScores[state.team2Country].questionsUsed.length;
    document.getElementById('questionsLeft1').textContent = `${left1} preguntas restantes`;
    document.getElementById('questionsLeft2').textContent = `${left2} preguntas restantes`;

    // Buzzer buttons
    document.getElementById('buzzerFlag1').src = c1.flagImg;
    document.getElementById('buzzerFlag2').src = c2.flagImg;
    document.getElementById('buzzerName1').textContent = t1Name;
    document.getElementById('buzzerName2').textContent = t2Name;
    document.getElementById('buzzerCountry1').textContent = c1.name;
    document.getElementById('buzzerCountry2').textContent = c2.name;

    showScreen('game');
}

// ===== BUZZER =====
function onBuzzer(teamIndex) {
    initAudio(); playSound('buzzer');
    state.currentTeam = teamIndex;

    const countryKey = teamIndex === 0 ? state.team1Country : state.team2Country;
    const country = QUESTIONS_DB[countryKey];
    const gs = state.globalScores[countryKey];

    // Available questions
    const available = [];
    for (let i = 0; i < country.questions.length; i++) {
        if (!gs.questionsUsed.includes(i)) available.push(i);
    }

    if (available.length === 0) {
        alert(`¡Se acabaron las preguntas de ${country.name}!`);
        return;
    }

    const randomIdx = available[Math.floor(Math.random() * available.length)];
    state.currentQuestionIndex = randomIdx;
    state.answered = false;

    const question = country.questions[randomIdx];
    const teamName = gs.teamName || country.name;

    // Question UI
    document.getElementById('qFlagImg').src = country.flagImg;
    document.getElementById('qCountry').textContent = country.name;
    document.getElementById('qPlayerName').textContent = teamName;
    document.getElementById('questionPlayerInfo').className = 'question-player-info ' +
        (teamIndex === 0 ? 'player1-active' : 'player2-active');
    document.getElementById('qNumber').textContent = `Pregunta ${gs.questionsUsed.length + 1}/${country.questions.length}`;
    document.getElementById('questionText').textContent = question.q;

    const letters = ['A', 'B', 'C', 'D'];
    const optionBtns = document.getElementById('optionsGrid').querySelectorAll('.option-btn');
    optionBtns.forEach((btn, i) => {
        btn.className = 'option-btn';
        btn.querySelector('.option-letter').textContent = letters[i];
        btn.querySelector('.option-text').textContent = question.options[i];
        btn.onclick = () => onAnswer(i);
    });

    document.getElementById('questionActions').style.display = 'none';
    startTimer();
    showScreen('question');
}

// ===== TIMER =====
function startTimer() {
    clearInterval(state.timer);
    state.timerValue = state.timerMax;
    document.getElementById('timerFill').style.width = '100%';
    document.getElementById('timerFill').classList.remove('warning');
    state.timer = setInterval(() => {
        state.timerValue--;
        document.getElementById('timerFill').style.width = ((state.timerValue / state.timerMax) * 100) + '%';
        if (state.timerValue <= 10) {
            document.getElementById('timerFill').classList.add('warning');
            if (state.timerValue > 0 && state.timerValue <= 5) playSound('tick');
        }
        if (state.timerValue <= 0) { clearInterval(state.timer); if (!state.answered) timeUp(); }
    }, 1000);
}
function stopTimer() { clearInterval(state.timer); }

function timeUp() {
    state.answered = true;
    playSound('incorrect');
    const countryKey = state.currentTeam === 0 ? state.team1Country : state.team2Country;
    const question = QUESTIONS_DB[countryKey].questions[state.currentQuestionIndex];
    state.globalScores[countryKey].questionsUsed.push(state.currentQuestionIndex);

    const optionBtns = document.getElementById('optionsGrid').querySelectorAll('.option-btn');
    optionBtns.forEach((btn, i) => {
        btn.classList.add('disabled');
        if (i === question.answer) btn.classList.add('correct');
    });
    document.body.classList.add('flash-incorrect');
    setTimeout(() => document.body.classList.remove('flash-incorrect'), 300);
    document.getElementById('questionActions').style.display = 'flex';
}

// ===== ANSWER =====
function onAnswer(optionIndex) {
    if (state.answered) return;
    state.answered = true;
    stopTimer();

    const countryKey = state.currentTeam === 0 ? state.team1Country : state.team2Country;
    const question = QUESTIONS_DB[countryKey].questions[state.currentQuestionIndex];
    const isCorrect = optionIndex === question.answer;

    state.globalScores[countryKey].questionsUsed.push(state.currentQuestionIndex);

    const optionBtns = document.getElementById('optionsGrid').querySelectorAll('.option-btn');
    optionBtns.forEach((btn, i) => {
        btn.classList.add('disabled');
        if (i === question.answer) btn.classList.add('correct');
        if (i === optionIndex && !isCorrect) btn.classList.add('incorrect');
    });

    if (isCorrect) {
        playSound('correct');
        state.globalScores[countryKey].score += 10;
        document.body.classList.add('flash-correct');
        setTimeout(() => document.body.classList.remove('flash-correct'), 300);
    } else {
        playSound('incorrect');
        document.body.classList.add('flash-incorrect');
        setTimeout(() => document.body.classList.remove('flash-incorrect'), 300);
    }

    document.getElementById('questionActions').style.display = 'flex';
}

// ===== BACK TO SETUP (after answering) =====
function goBackToSetup() {
    playSound('click');
    stopTimer();
    // Clear current matchup
    state.team1Country = null;
    state.team2Country = null;
    // Clear name inputs for next matchup
    document.getElementById('team1Name').value = '';
    document.getElementById('team2Name').value = '';
    // Rebuild UI
    buildCountrySelectors();
    updateSelectionUI();
    renderPodium('podiumList');
    showScreen('setup');
}

// ===== SHOW RESULTS =====
function showFinalResults() {
    playSound('victory');
    launchConfetti();

    const container = document.getElementById('finalPodium');
    container.innerHTML = '';

    const sorted = Object.keys(state.globalScores).map(key => ({
        key, ...state.globalScores[key], country: QUESTIONS_DB[key]
    })).filter(e => e.score > 0 || e.teamName)
        .sort((a, b) => b.score - a.score);

    const medals = ['🥇', '🥈', '🥉'];

    sorted.forEach((entry, idx) => {
        const row = document.createElement('div');
        row.className = 'final-row';
        if (idx < 3) row.classList.add(`f-rank-${idx + 1}`);
        const displayName = entry.teamName || entry.country.name;
        row.innerHTML = `
            <span class="final-medal">${idx < 3 ? medals[idx] : (idx + 1)}</span>
            <img src="${entry.country.flagImg}" alt="${entry.country.name}" class="final-flag">
            <div class="final-info">
                <span class="final-team">${displayName}</span>
                <span class="final-country">${entry.country.name}</span>
            </div>
            <span class="final-score">${entry.score}</span>
        `;
        container.appendChild(row);
    });

    if (sorted.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No hay puntajes aún</p>';
    }

    showScreen('result');
}

// ===== FULL RESET =====
function fullReset() {
    state.globalScores = {};
    state.team1Country = null;
    state.team2Country = null;
    state.currentTeam = null;
    state.answered = false;
    stopTimer();
    document.getElementById('team1Name').value = '';
    document.getElementById('team2Name').value = '';
    initGlobalScores();
    buildCountrySelectors();
    updateSelectionUI();
    renderPodium('podiumList');
    showScreen('setup');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initGlobalScores();
    buildCountrySelectors();
    updateSelectionUI();
    renderPodium('podiumList');

    // Start round
    document.getElementById('startGameBtn').addEventListener('click', startRound);

    // Buzzer
    document.getElementById('buzzerTeam1').addEventListener('click', () => onBuzzer(0));
    document.getElementById('buzzerTeam2').addEventListener('click', () => onBuzzer(1));

    // After question → back to setup for new teams
    document.getElementById('backToSetupBtn').addEventListener('click', goBackToSetup);

    // Results page → restart
    document.getElementById('restartBtn').addEventListener('click', () => {
        if (confirm('¿Reiniciar TODO el torneo? Se perderán todos los puntos.')) fullReset();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (screens.game.classList.contains('active')) {
            if (e.key === '1' || e.key === 'ArrowLeft') onBuzzer(0);
            else if (e.key === '2' || e.key === 'ArrowRight') onBuzzer(1);
        }
        if (screens.question.classList.contains('active') && !state.answered) {
            if (e.key.toLowerCase() === 'a' || e.key === '1') onAnswer(0);
            else if (e.key.toLowerCase() === 'b' || e.key === '2') onAnswer(1);
            else if (e.key.toLowerCase() === 'c' || e.key === '3') onAnswer(2);
            else if (e.key.toLowerCase() === 'd' || e.key === '4') onAnswer(3);
        }
        if (screens.question.classList.contains('active') && state.answered) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBackToSetup(); }
        }
    });
});
