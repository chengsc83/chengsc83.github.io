// --- DOM Elements ---
const fullscreenButton = document.getElementById('fullscreenButton');
const setupPhaseDiv = document.getElementById('setupPhase');
const debatePhaseDiv = document.getElementById('debatePhase');
const formatSelect = document.getElementById('formatSelect');
const confirmSetupButton = document.getElementById('confirmSetupButton');
const positiveTeamNameInput = document.getElementById('positiveTeamNameInput');
const negativeTeamNameInput = document.getElementById('negativeTeamNameInput');
const debateTopicInput = document.getElementById('debateTopicInput');
const debateInfoDisplay = document.getElementById('debateInfoDisplay');
const drawRebuttalOrderSection = document.getElementById('drawRebuttalOrderSection');
const startDrawButton = document.getElementById('startDrawButton');
const drawResultDisplay = document.getElementById('drawResultDisplay');
const moderatorScriptDisplay = document.getElementById('moderatorScript');
const timerDisplay = document.getElementById('timerDisplay');
const timerStatusDisplay = document.getElementById('timerStatus');
const currentStageInfoDisplay = document.getElementById('currentStageInfo');
const speechRecognitionStatusDisplay = document.getElementById('speechRecognitionStatus');
const nextStageButton = document.getElementById('nextStageButton');
const manualStartTimerButton = document.getElementById('manualStartTimerButton');
const forceStartMainTimerButton = document.getElementById('forceStartMainTimerButton');
const resetButton = document.getElementById('resetButton');
const pauseResumeTimerButton = document.getElementById('pauseResumeTimerButton');
const skipStageButton = document.getElementById('skipStageButton');
const exportFlowButton = document.getElementById('exportFlowButton');
const importFlowInput = document.getElementById('importFlowInput');
const loadImportedFlowButton = document.getElementById('loadImportedFlowButton');
const fileImportStatus = document.getElementById('fileImportStatus');
const audioElements = { warningSound1min: document.getElementById('warningSound1min'), warningSound30sec: document.getElementById('warningSound30sec'), timesUpSound: document.getElementById('timesUpSound'), stageAdvanceSound: document.getElementById('stageAdvanceSound'), speechDetectedSound: document.getElementById('speechDetectedSound'), drawSound: document.getElementById('drawSound') };
const editFlowButton = document.getElementById('editFlowButton');
const flowEditorSection = document.getElementById('flowEditorSection');
const flowEditorList = document.getElementById('flowEditorList');
const addStageButton = document.getElementById('addStageButton');
const finishEditingButton = document.getElementById('finishEditingButton');
const cancelEditingButton = document.getElementById('cancelEditingButton');
const stageEditModal = document.getElementById('stageEditModal');
const modalTitle = document.getElementById('modalTitle');
const editingStageIndexInput = document.getElementById('editingStageIndex');
const stageNameInput = document.getElementById('stageNameInput');
const stageTypeSelect = document.getElementById('stageTypeSelect');
const durationInputContainer = document.getElementById('durationInputContainer');
const stageDurationInput = document.getElementById('stageDurationInput');
const timerLabelInputContainer = document.getElementById('timerLabelInputContainer');
const stageTimerLabelInput = document.getElementById('stageTimerLabelInput');
const stageScriptInput = document.getElementById('stageScriptInput');
const timerProgressBarContainer = document.getElementById('timerProgressBarContainer');
const timerProgressBar = document.getElementById('timerProgressBar');
const nextSegmentPreview = document.getElementById('nextSegmentPreview');
const themeToggleButton = document.getElementById('themeToggleButton');
const bodyElement = document.body; // bodyElement 已在此宣告
const shortcutHelpModal = document.getElementById('shortcutHelpModal');
const shortcutHelpCloseButton = shortcutHelpModal.querySelector('.close-button');
const fullscreenRealTimeClock = document.getElementById('fullscreenRealTimeClock');

const timingSettingsFieldset = document.getElementById('timingSettingsFieldset');
const speechAutoSettingsFieldset = document.getElementById('speechAutoSettingsFieldset');
const graceDurationInputContainer = document.getElementById('graceDurationInputContainer');
const stageGraceDurationInput = document.getElementById('stageGraceDurationInput');
const graceEndActionContainer = document.getElementById('graceEndActionContainer');
const stageGraceEndActionSelect = document.getElementById('stageGraceEndActionSelect');
const autoModeToggle = document.getElementById('autoModeToggle');


// --- State Variables ---
let positiveTeamName = "正方"; let negativeTeamName = "反方"; let debateTopic = "（在此輸入辯題）"; let rebuttalOrder = null; let currentStageIndex = -1; let timerInterval; let graceTimerInterval; let timeLeft; let isTimerPaused = false; let currentTimerType = null; let synth = window.speechSynthesis; let voices = []; const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition; let recognition; let isRecognizing = false; let recognitionManuallyStopped = false; let mainSpeechTimerStartedByGrace = false;
const DEFAULT_GRACE_PERIOD_DURATION = 60;
let importedDebateStages = null; let currentFlowDefinition = []; let originalFlowBeforeEdit = null; let initialTimerDuration = 0;
let currentInsertBeforeIndex = null;
let realTimeClockInterval = null;
let isAutoModeEnabled = false;
let screenWakeLockSentinel = null;

const stageIcons = {
    announcement: '📢',
    draw_rebuttal_order: '🎲',
    manual_prep: '⏱️',
    speech_auto: '🎤'
};


const debateFormatDefinitions = {
    "菁英盃 (新式奧瑞岡五五四制)": [
        { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡五五四制。", timerLabel: null },
        { name: "結辯順序抽籤", type: "draw_rebuttal_order", duration: null, script: "首先，我們來進行結辯順序抽籤。請點擊下方按鈕開始抽籤。", timerLabel: null },
        { name: "開賽預備", type: "manual_prep", duration: 60, script: "結辯順序抽籤完畢。主席宣布，比賽開始。{{positive_team_name}}一辯準備上台申論，計時一分鐘準備時間。", timerLabel: "整體準備時間" },
        { name: "正方一辯 申論", type: "speech_auto", duration: 300, script: "準備時間結束。現在請{{positive_team_name}}一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言，否則將自動開始計時。", timerLabel: "申論時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 300, script: "感謝{{positive_team_name}}一辯。接著請{{negative_team_name}}二辯上臺質詢{{positive_team_name}}一辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反方一辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請{{negative_team_name}}一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 300, script: "感謝{{negative_team_name}}一辯。接著請{{positive_team_name}}三辯上臺質詢{{negative_team_name}}一辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "正方二辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請{{positive_team_name}}二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 300, script: "感謝{{positive_team_name}}二辯。接著請{{negative_team_name}}三辯上臺質詢{{positive_team_name}}二辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反方二辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請{{negative_team_name}}二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 300, script: "感謝{{negative_team_name}}二辯。接著請{{positive_team_name}}一辯上臺質詢{{negative_team_name}}二辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "正方三辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請{{positive_team_name}}三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 300, script: "感謝{{positive_team_name}}三辯。接著請{{negative_team_name}}一辯上臺質詢{{positive_team_name}}三辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反方三辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請{{negative_team_name}}三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 300, script: "感謝{{negative_team_name}}三辯。接著請{{positive_team_name}}二辯上臺質詢{{negative_team_name}}三辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "結辯準備", type: "manual_prep", duration: 180, script: "申論質詢階段完畢。先前抽籤結果為 {{first_rebuttal_team_name}} 先結辯。雙方將有三分鐘準備結辯。計時開始。", timerLabel: "結辯準備時間" },
        { name: "先結辯方 結辯", type: "speech_auto", duration: 240, script: "準備時間到。現在請 {{first_rebuttal_team_name}} 代表上臺結辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "後結辯方 結辯", type: "speech_auto", duration: 240, script: "感謝 {{first_rebuttal_team_name}} 代表。現在請 {{second_rebuttal_team_name}} 代表上臺結辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。感謝 {{positive_team_name}} 與 {{negative_team_name}} 各位辯士的精彩表現。", timerLabel: null },
        { name: "抗議提出時間", type: "manual_prep", duration: 600, script: "若有抗議事項，請於十分鐘內以書面方式向主席提出。計時開始。", timerLabel: "抗議提出時間" },
        { name: "正式結束", type: "announcement", duration: null, script: "抗議提出時間結束。感謝各位的參與。", timerLabel: null }
    ],
    "簡易三對三奧瑞岡 (3-3-2制 示例)": [
        { name: "賽前準備", type: "announcement", duration: null, script: "簡易三對三奧瑞岡開始。辯題：{{debate_topic}}。正方：{{positive_team_name}}，反方：{{negative_team_name}}。", timerLabel: null },
        { name: "結辯順序抽籤", type: "draw_rebuttal_order", duration: null, script: "進行結辯順序抽籤。", timerLabel: null },
        { name: "開賽預備", type: "manual_prep", duration: 30, script: "抽籤完畢。{{positive_team_name}}一辯準備，計時30秒。", timerLabel: "準備" },
        { name: "正一申論", type: "speech_auto", duration: 180, script: "請{{positive_team_name}}一辯申論，3分鐘。", timerLabel: "申論", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反二質詢正一", type: "speech_auto", duration: 180, script: "請{{negative_team_name}}二辯質詢{{positive_team_name}}一辯，3分鐘。", timerLabel: "質詢", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反一申論", type: "speech_auto", duration: 180, script: "請{{negative_team_name}}一辯申論，3分鐘。", timerLabel: "申論", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "正二質詢反一", type: "speech_auto", duration: 180, script: "請{{positive_team_name}}二辯質詢{{negative_team_name}}一辯，3分鐘。", timerLabel: "質詢", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "正三申論", type: "speech_auto", duration: 180, script: "請{{positive_team_name}}三辯申論，3分鐘。", timerLabel: "申論", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反一質詢正三", type: "speech_auto", duration: 180, script: "請{{negative_team_name}}一辯質詢{{positive_team_name}}三辯，3分鐘。", timerLabel: "質詢", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "反三申論", type: "speech_auto", duration: 180, script: "請{{negative_team_name}}三辯申論，3分鐘。", timerLabel: "申論", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "正一質詢反三", type: "speech_auto", duration: 180, script: "請{{positive_team_name}}一辯質詢{{negative_team_name}}三辯，3分鐘。", timerLabel: "質詢", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "結辯準備", type: "manual_prep", duration: 60, script: "申論質詢完畢。先前抽籤為 {{first_rebuttal_team_name}} 先結辯。準備結辯，1分鐘。", timerLabel: "結辯準備" },
        { name: "先結辯方結辯", type: "speech_auto", duration: 120, script: "請 {{first_rebuttal_team_name}} 結辯，2分鐘。", timerLabel: "結辯", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "後結辯方結辯", type: "speech_auto", duration: 120, script: "請 {{second_rebuttal_team_name}} 結辯，2分鐘。", timerLabel: "結辯", graceDuration: DEFAULT_GRACE_PERIOD_DURATION, graceEndAction: "auto_start" },
        { name: "比賽結束", type: "announcement", duration: null, script: "比賽結束。感謝各位。", timerLabel: null }
    ]
};

// --- Screen Wake Lock Functions ---
async function requestScreenWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            if (screenWakeLockSentinel) {
                await screenWakeLockSentinel.release();
                screenWakeLockSentinel = null;
            }
            screenWakeLockSentinel = await navigator.wakeLock.request('screen');
            screenWakeLockSentinel.addEventListener('release', () => {
                screenWakeLockSentinel = null;
            });
        } catch (err) {
            console.error(`螢幕喚醒鎖請求失敗: ${err.name}, ${err.message}`);
            screenWakeLockSentinel = null;
        }
    } else {
        console.warn('此瀏覽器不支援 Screen Wake Lock API。');
    }
}

async function releaseScreenWakeLock() {
    if (screenWakeLockSentinel) {
        try {
            await screenWakeLockSentinel.release();
        } catch (err) {
            // Errors can happen if the lock was already released by the system.
        } finally {
            screenWakeLockSentinel = null;
        }
    }
}


function playSound(soundName) { const audio = audioElements[soundName]; if (audio) { audio.currentTime = 0; audio.play().catch(error => console.warn(`Error playing sound "${soundName}":`, error.message)); } }
function populateVoiceList() { voices = synth.getVoices().filter(voice => voice.lang.startsWith('zh')); if (voices.length === 0) voices = synth.getVoices(); }
populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = populateVoiceList;
function speak(text, callback) { if (synth.speaking) synth.cancel(); const u = new SpeechSynthesisUtterance(text); u.onend = () => { if (callback) callback(); }; u.onerror = (event) => { console.warn('SpeechSynErr:', event.error); if (callback) callback(); }; let v = voices.find(vo => vo.lang === 'zh-TW' || vo.lang === 'zh-CN') || voices.find(vo => vo.lang.startsWith('zh')); if(v) u.voice = v; else if(voices.length > 0) u.voice = voices[0]; synth.speak(u); }
function interpolateScript(script) { let firstTeam = "", secondTeam = ""; if(rebuttalOrder){ firstTeam = rebuttalOrder === 'positive_first' ? positiveTeamName : negativeTeamName; secondTeam = rebuttalOrder === 'positive_first' ? negativeTeamName : positiveTeamName; } return script.replace(/\{\{positive_team_name\}\}/g, positiveTeamName).replace(/\{\{negative_team_name\}\}/g, negativeTeamName).replace(/\{\{debate_topic\}\}/g, debateTopic).replace(/\{\{first_rebuttal_team_name\}\}/g, firstTeam).replace(/\{\{second_rebuttal_team_name\}\}/g, secondTeam); }
function formatTime(seconds) { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; }
function updateTimerDisplayDOM(currentTime) { timerDisplay.textContent = formatTime(currentTime); }

function updateProgressBar(currentTime, totalDuration) {
    if (totalDuration <= 0) {
        timerProgressBar.style.width = '0%';
        return;
    }
    const percentageElapsed = ((totalDuration - currentTime) / totalDuration) * 100;
    timerProgressBar.style.width = `${Math.min(100, Math.max(0, percentageElapsed))}%`;

    const isFullscreen = document.body.classList.contains('fullscreen-active'); // Keep this class for fullscreen specific layout changes
    let progressBarColorState = "";

    // These colors are defined in CSS using variables, but fullscreen might have overrides
    let colorWarning = getComputedStyle(document.documentElement).getPropertyValue('--color-warning').trim();
    let colorOrangeAccent = getComputedStyle(document.documentElement).getPropertyValue('--color-orange-accent').trim();
    let colorDanger = getComputedStyle(document.documentElement).getPropertyValue('--color-danger').trim();
    let colorPrimary = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();

    if (isFullscreen) { // Fullscreen might use fixed color values if CSS vars aren't easily accessible/updated
        colorWarning = '#FFB84D'; // Example fixed color
        colorOrangeAccent = '#FF6B4D'; // Example fixed color
        colorDanger = '#F87171'; // Example fixed color
        colorPrimary = '#259DFA'; // Example fixed color
    }


    if (currentTime <= 0) {
        timerProgressBar.style.backgroundColor = colorDanger;
         progressBarColorState = "timesup";
    } else if (currentTime <= 30 && totalDuration > 30) {
        timerProgressBar.style.backgroundColor = colorOrangeAccent;
        progressBarColorState = "warning30sec";
    } else if (currentTime <= 60 && totalDuration > 60) {
        timerProgressBar.style.backgroundColor = colorWarning;
         progressBarColorState = "warning1min";
    } else {
        timerProgressBar.style.backgroundColor = colorPrimary;
         progressBarColorState = "";
    }

    // This data attribute can be used by CSS for more complex styling if needed, especially in fullscreen
    if (isFullscreen) {
        timerProgressBar.dataset.colorState = progressBarColorState;
    } else {
         timerProgressBar.removeAttribute('data-color-state');
    }
}

function startRecognitionConditionally() { if (SpeechRecognition && recognition && !isRecognizing && currentTimerType === 'grace' && !isTimerPaused) { recognitionManuallyStopped = false; try { recognition.start(); } catch(e) { console.error("SR start err:", e); speechRecognitionStatusDisplay.textContent = "啟動識別失敗。";}} }
function stopRecognitionForce() { recognitionManuallyStopped = true; if (SpeechRecognition && recognition && isRecognizing) { try { recognition.stop(); } catch (e) { if (e.name !== 'InvalidStateError'){console.error("SR stop err:", e);}}} isRecognizing = false; }
if (SpeechRecognition) {
    recognition = new SpeechRecognition(); recognition.continuous = true; recognition.interimResults = false; recognition.lang = 'zh-TW';
    recognition.onstart = () => { isRecognizing = true; recognitionManuallyStopped = false; speechRecognitionStatusDisplay.textContent = "語音識別已啟動...";};
    recognition.onresult = (event) => { if (currentTimerType === 'grace' && graceTimerInterval && !mainSpeechTimerStartedByGrace && !isTimerPaused) { clearTimeout(graceTimerInterval); graceTimerInterval = null; forceStartMainTimerButton.classList.add('hidden'); skipStageButton.classList.add('hidden'); timerStatusDisplay.textContent = "偵測到發言..."; speak("偵測到發言，計時開始。", () => startMainSpeechTimer(currentFlowDefinition[currentStageIndex].duration)); playSound('speechDetectedSound'); mainSpeechTimerStartedByGrace = true;}};
    recognition.onerror = (event) => {isRecognizing = false; console.warn("SR.onerror:", event.error, event.message); let msg=`SR Err: ${event.error}`; let restart = false; if(event.error==='no-speech'){msg="未偵測到語音。"; restart=true;} else if(event.error==='audio-capture')msg="麥克風錯誤。"; else if(event.error==='not-allowed'){msg="麥克風權限未授予。"; alert(msg); if(currentFlowDefinition[currentStageIndex] && currentFlowDefinition[currentStageIndex].type === 'speech_auto' && currentTimerType === 'grace')forceStartMainTimerButton.classList.remove('hidden');} else if(event.error === 'aborted'){msg="語音識別被中止。";} else if (event.error === 'network' || event.error === 'service-not-allowed'){msg=`服務錯誤(${event.error})。`; restart=true;} if(event.error !== 'aborted')speechRecognitionStatusDisplay.textContent=msg; if (currentTimerType === 'grace' && !isTimerPaused && graceTimerInterval && restart && !recognitionManuallyStopped){console.log(`SR err (${event.error}), restarting...`); setTimeout(startRecognitionConditionally, 250);}};
    recognition.onend = () => { const wasRec = isRecognizing; isRecognizing = false; if (currentTimerType === 'grace' && !isTimerPaused && graceTimerInterval && !recognitionManuallyStopped && wasRec){console.log("SR ended early, restarting..."); setTimeout(startRecognitionConditionally, 250);} else {const cs=speechRecognitionStatusDisplay.textContent; if(!cs.includes("錯誤")&&!cs.includes("未授予")&&cs!=="語音識別已啟動..." && (!cs.includes("中止") || !recognitionManuallyStopped) ){}}};
} else { speechRecognitionStatusDisplay.textContent = "瀏覽器不支援語音識別。"; }

function clearAllTimersAndIntervals() {
    releaseScreenWakeLock();
    clearInterval(timerInterval); clearInterval(graceTimerInterval); timerInterval = null; graceTimerInterval = null; isTimerPaused = false; currentTimerType = null; pauseResumeTimerButton.textContent = "暫停計時"; pauseResumeTimerButton.classList.add('hidden'); skipStageButton.classList.add('hidden'); forceStartMainTimerButton.classList.add('hidden'); timerProgressBar.style.width = '0%'; timerProgressBarContainer.classList.add('hidden');}

function runActiveTimerInterval() {
    if (isTimerPaused) return;
    timeLeft--;
    updateTimerDisplayDOM(timeLeft);
    if (currentTimerType === 'main' || currentTimerType === 'manual_prep' || currentTimerType === 'grace') {
         updateProgressBar(timeLeft, initialTimerDuration);
    }

    // Timer text color is now primarily handled by CSS variables via data-theme and .fullscreen-active
    // However, specific JS overrides might still be needed if CSS isn't sufficient for all states.
    // We rely on handleFullscreenChange to set initial colors based on theme/fullscreen.
    // This function will primarily handle "Time's Up" state change for timerDisplay if not covered by CSS.

    if (currentTimerType === 'grace') {
         if (timeLeft <= 0) {
            clearTimeout(graceTimerInterval);
            graceTimerInterval = null;
            stopRecognitionForce();
            forceStartMainTimerButton.classList.add('hidden');
            if (!mainSpeechTimerStartedByGrace) {
                const currentStage = currentFlowDefinition[currentStageIndex];
                const graceEndAction = currentStage.graceEndAction || 'auto_start';

                switch(graceEndAction) {
                    case 'auto_start':
                        timerStatusDisplay.textContent = "發言準備時間已到...";
                        speak("準備時間到，計時開始。", () => {
                            startMainSpeechTimer(currentStage.duration);
                            pauseResumeTimerButton.classList.remove('hidden');
                            pauseResumeTimerButton.textContent = "暫停計時";
                            skipStageButton.classList.add('hidden');
                        });
                        mainSpeechTimerStartedByGrace = true;
                        break;
                    case 'manual_start':
                        timerStatusDisplay.textContent = "準備時間已到，請手動開始計時。";
                        speak("準備時間到，請手動開始計時。");
                        forceStartMainTimerButton.classList.remove('hidden');
                        forceStartMainTimerButton.textContent = "開始主要計時";
                        nextStageButton.disabled = true;
                        pauseResumeTimerButton.classList.add('hidden');
                        break;
                    case 'auto_skip':
                        timerStatusDisplay.textContent = "準備時間已到，自動跳過此階段。";
                        speak("準備時間到，自動跳過此階段。", () => {
                            if(isAutoModeEnabled || currentStage.graceEndAction === 'auto_skip') { 
                                loadNextStage();
                            }
                        });
                        break;
                }
            }
        }
    } else if (currentTimerType === 'main' || currentTimerType === 'manual_prep') {
        const d = initialTimerDuration;
        const endedStageIndex = currentStageIndex; 

        if (timeLeft === 60 && d > 60) {
            speak("時間剩餘一分鐘");
            timerDisplay.classList.add('warning1min'); // Add class for CSS styling
            timerDisplay.classList.remove('warning30sec', 'timesup');
            playSound('warningSound1min');
        } else if (timeLeft === 30 && d > 30) {
            speak("時間剩餘三十秒");
            timerDisplay.classList.add('warning30sec'); // Add class for CSS styling
            timerDisplay.classList.remove('warning1min', 'timesup');
            playSound('warningSound30sec');
        } else if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            speak("時間到");
            timerDisplay.textContent = "時間到"; // Keep this text
            timerDisplay.classList.add('timesup'); // Add class for CSS styling
            timerDisplay.classList.remove('warning1min', 'warning30sec');
            playSound('timesUpSound');
            currentTimerType = null;
            releaseScreenWakeLock();

            if (endedStageIndex >= currentFlowDefinition.length - 1) {
                nextStageButton.disabled = true;
            } else {
                const wouldOriginalAutoAdvance = currentFlowDefinition[endedStageIndex]?.type === "manual_prep" && endedStageIndex < currentFlowDefinition.length - 2;
                if (isAutoModeEnabled) {
                    timerStatusDisplay.textContent = "時間到，準備進入下一階段...";
                    setTimeout(() => {
                        if (currentStageIndex === endedStageIndex && !isTimerPaused && !timerInterval && !graceTimerInterval) {
                             loadNextStage();
                        }
                    }, 2000);
                } else {
                    if (wouldOriginalAutoAdvance) {
                         loadNextStage();
                    } else {
                         nextStageButton.disabled = false;
                    }
                }
            }
        } else if (timeLeft > 60 || (timeLeft > 30 && d <=60) || (d <= 30)) {
            // Remove warning classes if time is above thresholds
            timerDisplay.classList.remove('warning1min', 'warning30sec', 'timesup');
        }
    }
}
async function startGracePeriodTimer() {
    await requestScreenWakeLock();
    clearAllTimersAndIntervals();
    await requestScreenWakeLock();
    currentTimerType = 'grace';
    mainSpeechTimerStartedByGrace = false;

    const currentStage = currentFlowDefinition[currentStageIndex];
    const graceDuration = (typeof currentStage.graceDuration === 'number' && currentStage.graceDuration >= 0)
                                ? currentStage.graceDuration
                                : DEFAULT_GRACE_PERIOD_DURATION;

    timeLeft = graceDuration;
    initialTimerDuration = graceDuration;

    timerStatusDisplay.textContent = `請於${formatTime(graceDuration)}內開始發言...`;
    updateTimerDisplayDOM(timeLeft);
    timerDisplay.classList.remove('hidden');
    timerDisplay.classList.remove('warning1min', 'warning30sec', 'timesup'); // Reset timer text color classes
    timerProgressBarContainer.classList.remove('hidden');
    updateProgressBar(timeLeft, initialTimerDuration);
    // Timer text color is handled by handleFullscreenChange and CSS based on theme/fullscreen

    speechRecognitionStatusDisplay.classList.remove('hidden');

    const graceEndAction = currentStage.graceEndAction || 'auto_start';
    if (graceEndAction !== 'auto_skip') {
        forceStartMainTimerButton.classList.remove('hidden');
        forceStartMainTimerButton.textContent = "強制開始發言計時";
    } else {
         forceStartMainTimerButton.classList.add('hidden');
    }

    pauseResumeTimerButton.textContent = "暫停計時";
    pauseResumeTimerButton.classList.remove('hidden');
    skipStageButton.classList.add('hidden');
    startRecognitionConditionally();
    graceTimerInterval = setInterval(runActiveTimerInterval, 1000);
}
async function startMainSpeechTimer(duration) {
    await requestScreenWakeLock();
    stopRecognitionForce();
    if (currentTimerType !== 'grace') {
        clearAllTimersAndIntervals();
        await requestScreenWakeLock();
    }
    currentTimerType = 'main';
    timeLeft = duration;
    initialTimerDuration = duration;
    timerStatusDisplay.textContent = (currentFlowDefinition[currentStageIndex]?.timerLabel || "計時") + "進行中...";
    updateTimerDisplayDOM(timeLeft);
    timerDisplay.classList.remove('hidden');
    timerDisplay.classList.remove('warning1min', 'warning30sec', 'timesup'); // Reset timer text color classes
    timerProgressBarContainer.classList.remove('hidden');
    updateProgressBar(timeLeft, initialTimerDuration);
    // Timer text color is handled by handleFullscreenChange and CSS based on theme/fullscreen

    nextStageButton.disabled = true;
    pauseResumeTimerButton.textContent = "暫停計時";
    pauseResumeTimerButton.classList.remove('hidden');
    skipStageButton.classList.add('hidden');
    forceStartMainTimerButton.classList.add('hidden');
    if (timerInterval) clearInterval(timerInterval);
    if (graceTimerInterval) { clearInterval(graceTimerInterval); graceTimerInterval = null; }
    timerInterval = setInterval(runActiveTimerInterval, 1000);
}
async function startManualPrepTimer(duration) {
    await requestScreenWakeLock();
    stopRecognitionForce();
    clearAllTimersAndIntervals();
    await requestScreenWakeLock();
    currentTimerType = 'manual_prep';
    timeLeft = duration;
    initialTimerDuration = duration;
    timerStatusDisplay.textContent = (currentFlowDefinition[currentStageIndex]?.timerLabel || "準備計時") + "進行中...";
    updateTimerDisplayDOM(timeLeft);
    timerDisplay.classList.remove('hidden');
    timerDisplay.classList.remove('warning1min', 'warning30sec', 'timesup'); // Reset timer text color classes
    timerProgressBarContainer.classList.remove('hidden');
    updateProgressBar(timeLeft, initialTimerDuration);
    // Timer text color is handled by handleFullscreenChange and CSS based on theme/fullscreen

    nextStageButton.disabled = true;
    manualStartTimerButton.disabled = true;
    pauseResumeTimerButton.textContent = "暫停計時";
    pauseResumeTimerButton.classList.remove('hidden');
    skipStageButton.classList.add('hidden');
    timerInterval = setInterval(runActiveTimerInterval, 1000);
}

pauseResumeTimerButton.addEventListener('click', () => {
    isTimerPaused = !isTimerPaused;
    if (isTimerPaused) {
        recognitionManuallyStopped = true;
        if(currentTimerType === 'grace' && graceTimerInterval) {
            clearInterval(graceTimerInterval);
            stopRecognitionForce();
        } else if ((currentTimerType === 'main' || currentTimerType === 'manual_prep') && timerInterval) {
            clearInterval(timerInterval);
        }
        pauseResumeTimerButton.textContent = "繼續計時";
        timerStatusDisplay.textContent += " (已暫停)";
        skipStageButton.classList.remove('hidden');
        nextStageButton.disabled = true; // Usually true, but confirm logic
    } else {
        if (currentTimerType === 'grace' || currentTimerType === 'main' || currentTimerType === 'manual_prep') {
            requestScreenWakeLock();
        }
        pauseResumeTimerButton.textContent = "暫停計時";
        timerStatusDisplay.textContent = timerStatusDisplay.textContent.replace(" (已暫停)", "");
        skipStageButton.classList.add('hidden');
        if (currentTimerType === 'grace') {
            startRecognitionConditionally();
            graceTimerInterval = setInterval(runActiveTimerInterval, 1000);
        } else if (currentTimerType === 'main' || currentTimerType === 'manual_prep') {
            timerInterval = setInterval(runActiveTimerInterval, 1000);
        }
        // nextStageButton.disabled depends on whether timer is running or not. 
        // If timer is running, it should be disabled.
        if (timerInterval || graceTimerInterval) {
            nextStageButton.disabled = true;
        }
    }
});
skipStageButton.addEventListener('click', () => { if (isTimerPaused) { stopRecognitionForce(); clearAllTimersAndIntervals(); loadNextStage(); }});

let sortableInstance = null;

function toggleMoreActionsDropdown(event) {
    event.stopPropagation();
    const dropdown = event.currentTarget.nextElementSibling;
    const isActive = dropdown.classList.contains('active');
    document.querySelectorAll('#flowEditorList .more-actions-dropdown.active').forEach(openDropdown => {
        if (openDropdown !== dropdown) { // Close other open dropdowns
            openDropdown.classList.remove('active');
        }
    });
    dropdown.classList.toggle('active'); // Toggle current dropdown
}

function renderEditorList() {
    flowEditorList.innerHTML = ''; 

    if (currentFlowDefinition.length === 0) {
        const li = document.createElement('li');
        li.classList.add('flow-editor-empty-prompt'); 
        li.innerHTML = `
            <span style="font-size: 1.5em; margin-bottom: 10px; display: block;">🤔</span>
            <strong>目前沒有任何流程階段</strong>
            <p>請點擊下方的「<span style="color: var(--color-success); font-weight: bold;">＋ 新增階段</span>」按鈕來建立您的第一個流程環節。</p>
        `; // Updated button text
        flowEditorList.appendChild(li);
        if (sortableInstance) {
            sortableInstance.option("disabled", true); 
        }
    } else {
        if (sortableInstance) {
            sortableInstance.option("disabled", false); 
        }
        currentFlowDefinition.forEach((stage, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;

            const stageInfoOuterDiv = document.createElement('div');
            stageInfoOuterDiv.classList.add('stage-info');

            const stageIconSpan = document.createElement('span');
            stageIconSpan.classList.add('stage-icon');
            stageIconSpan.textContent = stageIcons[stage.type] || '⚙️';
            stageInfoOuterDiv.appendChild(stageIconSpan);

            const stageTextDiv = document.createElement('div'); // Wrapper for text elements

            const nameStrong = document.createElement('strong');
            nameStrong.textContent = `${index + 1}. ${stage.name || '(未命名)'}`;
            stageTextDiv.appendChild(nameStrong);

            const detailsSpan = document.createElement('span');
            let detailsText = `類型: ${stage.type || '(未知)'}`;
            if (stage.duration) detailsText += `, 時間: ${stage.duration}s`;
            if (stage.type === 'speech_auto' && typeof stage.graceDuration === 'number') {
                detailsText += `, 緩衝: ${stage.graceDuration}s`;
            }
            detailsSpan.textContent = detailsText;
            stageTextDiv.appendChild(detailsSpan);

            if (stage.script) { // Only show script preview if script exists
                const scriptSpan = document.createElement('span');
                scriptSpan.classList.add('script-preview'); // Add class for styling
                scriptSpan.textContent = `稿件: ${stage.script.substring(0, 30)}${stage.script.length > 30 ? '...' : ''}`;
                stageTextDiv.appendChild(scriptSpan);
            }
            stageInfoOuterDiv.appendChild(stageTextDiv);


            const controlsDiv = document.createElement('div');
            controlsDiv.classList.add('editor-controls');

            const editButton = document.createElement('button');
            editButton.classList.add('btn', 'btn-sm', 'btn-outline'); // Added base btn classes
            editButton.title = '編輯此階段';
            editButton.innerHTML = '編輯'; 
            editButton.onclick = () => openEditModal(index);
            controlsDiv.appendChild(editButton);

            // "More Actions" button and dropdown
            const moreActionsContainer = document.createElement('div');
            moreActionsContainer.classList.add('more-actions-container');

            const moreButton = document.createElement('button');
            moreButton.classList.add('btn', 'btn-sm', 'more-actions-btn'); // Added base btn class
            moreButton.innerHTML = '...'; 
            moreButton.title = '更多操作';
            moreButton.onclick = toggleMoreActionsDropdown;
            moreActionsContainer.appendChild(moreButton);

            const dropdownDiv = document.createElement('div');
            dropdownDiv.classList.add('more-actions-dropdown');
            // Using onclick directly on buttons in innerHTML is fine for this case
            dropdownDiv.innerHTML = `
                <button onclick="openEditModal(-1, ${index})" title="在此階段之前插入新階段">＋ 前方插入</button>
                <button onclick="duplicateStage(${index})" title="複製此階段">複製</button>
                <button class="delete" onclick="deleteStage(${index})" title="刪除此階段">刪除</button>
                <button class="move move-up" onclick="moveStage(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="上移此階段">↑ 上移</button>
                <button class="move move-down" onclick="moveStage(${index}, 1)" ${index === currentFlowDefinition.length - 1 ? 'disabled' : ''} title="下移此階段">↓ 下移</button>
            `;
            moreActionsContainer.appendChild(dropdownDiv);
            controlsDiv.appendChild(moreActionsContainer);

            li.appendChild(stageInfoOuterDiv);
            li.appendChild(controlsDiv);
            flowEditorList.appendChild(li);
        });
    }

    if (sortableInstance && typeof sortableInstance.option === 'function') {
        sortableInstance.option("disabled", currentFlowDefinition.length === 0);
    } else if (currentFlowDefinition.length > 0 && !sortableInstance) { 
        sortableInstance = new Sortable(flowEditorList, {
            animation: 150,
            ghostClass: 'sortable-ghost', 
            handle: 'li', // Allow dragging by clicking anywhere on the li
            onEnd: function (evt) {
                const oldIndex = parseInt(evt.oldDraggableIndex);
                const newIndex = parseInt(evt.newDraggableIndex);
                if (oldIndex !== newIndex && !isNaN(oldIndex) && !isNaN(newIndex)) {
                    const [movedItem] = currentFlowDefinition.splice(oldIndex, 1);
                    currentFlowDefinition.splice(newIndex, 0, movedItem);
                    renderEditorList(); 
                }
            }
        });
    }
}


function deleteStage(index) {
    if (confirm(`確定要刪除階段 ${index + 1} (${currentFlowDefinition[index].name || '未命名階段'}) 嗎？`)) {
        currentFlowDefinition.splice(index, 1);
        renderEditorList(); 
    }
    // Close dropdown if open
    document.querySelectorAll('#flowEditorList .more-actions-dropdown.active').forEach(d => d.classList.remove('active'));
}

function openEditModal(index, insertBeforeIndexOpt = null) {
    const isNew = index === -1;
    currentInsertBeforeIndex = isNew ? insertBeforeIndexOpt : null; // insertBeforeIndexOpt will be the index to insert before
    modalTitle.textContent = isNew ? (currentInsertBeforeIndex !== null ? `在階段 ${currentInsertBeforeIndex + 1} 之前新增` : "新增階段 (末尾)") : `編輯階段 ${index + 1}`;
    editingStageIndexInput.value = index; // Store original index for editing, or -1 for new
    if (isNew) {
        stageNameInput.value = "";
        stageTypeSelect.value = "announcement";
        stageDurationInput.value = "";
        stageTimerLabelInput.value = "";
        stageScriptInput.value = "";
        stageGraceDurationInput.value = ""; // Default to placeholder, which implies DEFAULT_GRACE_PERIOD_DURATION
        stageGraceEndActionSelect.value = "auto_start";
    } else {
        const stage = currentFlowDefinition[index];
        stageNameInput.value = stage.name || "";
        stageTypeSelect.value = stage.type || "announcement";
        stageDurationInput.value = stage.duration || "";
        stageTimerLabelInput.value = stage.timerLabel || "";
        stageScriptInput.value = stage.script || "";
        stageGraceDurationInput.value = typeof stage.graceDuration === 'number' ? stage.graceDuration : "";
        stageGraceEndActionSelect.value = stage.graceEndAction || "auto_start";
    }
    handleModalFieldVisibility();
    stageEditModal.style.display = "flex"; // Use flex to center content
    stageNameInput.focus();
}

function closeModal() {
    stageEditModal.style.display = "none";
    currentInsertBeforeIndex = null; // Reset this state
    // Also ensure any open "more actions" dropdowns are closed
    document.querySelectorAll('#flowEditorList .more-actions-dropdown.active').forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

function handleModalFieldVisibility() {
    const selectedType = stageTypeSelect.value;
    const needsMainDurationAndLabel = ["manual_prep", "speech_auto"].includes(selectedType);
    const isSpeechAuto = selectedType === "speech_auto";

    // Show/hide the entire timing fieldset
    timingSettingsFieldset.classList.toggle('hidden', !needsMainDurationAndLabel && !isSpeechAuto);

    if (!timingSettingsFieldset.classList.contains('hidden')) {
        durationInputContainer.classList.toggle('hidden', !needsMainDurationAndLabel);
        timerLabelInputContainer.classList.toggle('hidden', !needsMainDurationAndLabel);
        graceDurationInputContainer.classList.toggle('hidden', !isSpeechAuto); // Only for speech_auto
    } else { // Hide all if fieldset is hidden
        durationInputContainer.classList.add('hidden');
        timerLabelInputContainer.classList.add('hidden');
        graceDurationInputContainer.classList.add('hidden');
    }
    
    speechAutoSettingsFieldset.classList.toggle('hidden', !isSpeechAuto);
}
stageTypeSelect.addEventListener('change', handleModalFieldVisibility);

function saveStageChanges() {
    const index = parseInt(editingStageIndexInput.value); // This is original index if editing, or -1 if new
    const isNew = index === -1;
    const stageData = {
        name: stageNameInput.value.trim() || (isNew ? "新階段" : `階段 ${index + 1}`),
        type: stageTypeSelect.value,
        script: stageScriptInput.value.trim(),
        duration: null,
        timerLabel: null,
        graceDuration: null, // Initialize to null
        graceEndAction: 'auto_start' // Default for speech_auto
    };

    if (["manual_prep", "speech_auto"].includes(stageData.type)) {
        const duration = parseInt(stageDurationInput.value);
        stageData.duration = isNaN(duration) || duration < 1 ? 60 : duration; // Default to 60s if invalid
        stageData.timerLabel = stageTimerLabelInput.value.trim() || null; // Null if empty
    }

    if (stageData.type === "speech_auto") {
        const graceDur = parseInt(stageGraceDurationInput.value);
        // If input is empty string, or NaN, or negative, use default. Otherwise use parsed value.
        stageData.graceDuration = (stageGraceDurationInput.value.trim() === "" || isNaN(graceDur) || graceDur < 0) 
                                  ? DEFAULT_GRACE_PERIOD_DURATION 
                                  : graceDur;
        stageData.graceEndAction = stageGraceEndActionSelect.value || 'auto_start';
    } else {
        // Ensure these are null for non-speech_auto types
        stageData.graceDuration = null;
        stageData.graceEndAction = null;
    }


    if (isNew) {
        if (currentInsertBeforeIndex !== null) { // If inserting before a specific index
            currentFlowDefinition.splice(currentInsertBeforeIndex, 0, stageData);
        } else { // Otherwise, push to the end
            currentFlowDefinition.push(stageData);
        }
    } else { // Existing stage
        currentFlowDefinition[index] = stageData;
    }
    renderEditorList();
    closeModal();
}

function duplicateStage(index) {
    if (index < 0 || index >= currentFlowDefinition.length) return;
    const originalStage = currentFlowDefinition[index];
    const duplicatedStage = JSON.parse(JSON.stringify(originalStage)); // Deep copy
    duplicatedStage.name = (duplicatedStage.name || "複製的階段") + " (副本)";
    currentFlowDefinition.splice(index + 1, 0, duplicatedStage); // Insert after original
    renderEditorList();
    // Close dropdown if open
    document.querySelectorAll('#flowEditorList .more-actions-dropdown.active').forEach(d => d.classList.remove('active'));
}

function moveStage(index, direction) { // direction is -1 for up, 1 for down
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentFlowDefinition.length) return; // Out of bounds

    const itemToMove = currentFlowDefinition.splice(index, 1)[0];
    currentFlowDefinition.splice(newIndex, 0, itemToMove);
    
    renderEditorList();
    // Close dropdown if open - though this might be disruptive if user wants to move multiple times
    // Consider if dropdown should close automatically after a move operation.
    // For now, let's keep it simple and not auto-close. User can click away.
}


function loadStage(index) {
    const stage = currentFlowDefinition[index];
    if (!stage) return;
    currentStageIndex = index; 

    currentStageInfoDisplay.textContent = `${stageIcons[stage.type] || ''} 目前階段：${interpolateScript(stage.name)}`;
    moderatorScriptDisplay.textContent = interpolateScript(stage.script);
    clearAllTimersAndIntervals();
    manualStartTimerButton.classList.add('hidden');
    speechRecognitionStatusDisplay.textContent = "";
    speechRecognitionStatusDisplay.classList.add('hidden');
    drawRebuttalOrderSection.classList.add('hidden');
    timerDisplay.classList.add('hidden');
    timerDisplay.classList.remove('warning1min', 'warning30sec', 'timesup'); // Clear color classes
    timerProgressBarContainer.classList.add('hidden');
    timerStatusDisplay.textContent = "";
    nextStageButton.disabled = false;
    forceStartMainTimerButton.textContent = "強制開始發言計時";

    if (currentStageIndex + 1 < currentFlowDefinition.length) {
        const nextStageDetails = currentFlowDefinition[currentStageIndex + 1];
        nextSegmentPreview.textContent = `下一環節：${interpolateScript(nextStageDetails.name)}`;
        nextSegmentPreview.classList.remove('hidden');
    } else {
        nextSegmentPreview.textContent = "最後環節";
        nextSegmentPreview.classList.remove('hidden'); // Show "最後環節"
    }

    handleFullscreenChange(); // Apply correct theme/fullscreen colors to timer text and progress bar

    speak(interpolateScript(stage.script), () => {
        if (stage.type === "speech_auto") {
            startGracePeriodTimer();
        } else if (stage.type === "manual_prep") {
            manualStartTimerButton.classList.remove('hidden');
            manualStartTimerButton.disabled = false;
            manualStartTimerButton.textContent = `開始${stage.timerLabel || '計時'}`;
            timerDisplay.classList.remove('hidden');
            timerProgressBarContainer.classList.remove('hidden');
            initialTimerDuration = stage.duration;
            updateProgressBar(stage.duration, stage.duration);
            timerStatusDisplay.textContent = (stage.timerLabel || "計時") + "準備開始...";
            updateTimerDisplayDOM(stage.duration);
        } else if (stage.type === "draw_rebuttal_order") {
            releaseScreenWakeLock();
            drawRebuttalOrderSection.classList.remove('hidden');
            drawResultDisplay.textContent = "待抽籤...";
            startDrawButton.disabled = false;
            nextStageButton.disabled = true;
        } else { // Handles 'announcement' and any other non-timed types
            releaseScreenWakeLock();
            timerDisplay.classList.add('hidden');
            timerProgressBarContainer.classList.add('hidden');
            timerStatusDisplay.textContent = "";
            if (currentStageIndex >= currentFlowDefinition.length -1) { 
                nextStageButton.disabled = true;
                nextSegmentPreview.textContent = "辯論已結束";
            } else {
                if (isAutoModeEnabled) { 
                    setTimeout(() => {
                        if (currentStageIndex === index && !isTimerPaused && !timerInterval && !graceTimerInterval) {
                             loadNextStage();
                        }
                    }, 2000); 
                } else {
                    nextStageButton.disabled = false;
                }
            }
        }
    });
}
function loadNextStage() {
    const previousStageIndex = currentStageIndex;
    const nextIndex = previousStageIndex + 1;

    stopRecognitionForce();

    if (nextIndex < currentFlowDefinition.length) {
        playSound('stageAdvanceSound');
        loadStage(nextIndex); 

        // Update timer display preview for next stage if it's timed
        const nextStageData = currentFlowDefinition[nextIndex];
        timerDisplay.classList.remove('warning1min', 'warning30sec', 'timesup'); // Reset color classes
        if (nextStageData?.type === 'speech_auto') {
            const graceDur = (typeof nextStageData.graceDuration === 'number' && nextStageData.graceDuration >=0) ? nextStageData.graceDuration : DEFAULT_GRACE_PERIOD_DURATION;
            timerDisplay.textContent = formatTime(graceDur);
        } else if (nextStageData?.duration && nextStageData?.type === 'manual_prep') {
            timerDisplay.textContent = formatTime(nextStageData.duration);
        } else {
             timerProgressBarContainer.classList.add('hidden');
             releaseScreenWakeLock();
        }
        handleFullscreenChange(); // Apply correct theme/fullscreen colors
    } else {
        currentStageIndex = nextIndex; 
        currentStageInfoDisplay.textContent = "所有流程已結束。";
        nextStageButton.disabled = true;
        clearAllTimersAndIntervals();
        nextSegmentPreview.textContent = "辯論已結束";
        nextSegmentPreview.classList.remove('hidden');
    }
}

// *** MODIFIED THEME FUNCTIONS ***
function applyTheme(theme) {
    const themeIcon = themeToggleButton.querySelector('.theme-icon');
    if (theme === 'dark') {
        bodyElement.setAttribute('data-theme', 'dark');
        if (themeIcon) themeIcon.textContent = '☀️'; // Sun icon for dark mode (to switch to light)
        themeToggleButton.title = '切換淺色模式';
        themeToggleButton.setAttribute('aria-pressed', 'true');
    } else {
        bodyElement.removeAttribute('data-theme'); // Or bodyElement.setAttribute('data-theme', 'light');
        if (themeIcon) themeIcon.textContent = '🌙'; // Moon icon for light mode (to switch to dark)
        themeToggleButton.title = '切換深色模式';
        themeToggleButton.setAttribute('aria-pressed', 'false');
    }
    handleFullscreenChange(); // Re-apply colors if fullscreen/theme changes affect timer display
}

function toggleTheme() {
    let newTheme;
    if (bodyElement.getAttribute('data-theme') === 'dark') {
        newTheme = 'light';
    } else {
        newTheme = 'dark';
    }
    applyTheme(newTheme);
    localStorage.setItem('debateTimerTheme', newTheme);
}
// *** END OF MODIFIED THEME FUNCTIONS ***


function showShortcutHelpModal() {
    shortcutHelpModal.style.display = "flex"; // Use flex to center
}
function closeShortcutHelpModal() {
    shortcutHelpModal.style.display = "none";
}

function updateRealTimeClock() {
    if (fullscreenRealTimeClock) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        fullscreenRealTimeClock.textContent = `${hours}:${minutes}:${seconds}`;
    }
}

function handleOrientationChange() {
    if (screen.orientation && screen.orientation.type) {
        const isLandscape = screen.orientation.type.includes('landscape');
        const isLikelyMobile = window.innerWidth < 800;
        const isCurrentlyFullscreen = !!document.fullscreenElement;

        if (isLandscape && isLikelyMobile && !isCurrentlyFullscreen) {
            console.log("Attempting auto-fullscreen on landscape...");
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Auto-fullscreen failed: ${err.message}. User interaction might be required first.`);
            });
        } else if (!isLandscape && isCurrentlyFullscreen) {
             console.log("Attempting to exit fullscreen on portrait...");
             if (document.exitFullscreen) {
                 document.exitFullscreen().catch(err => console.warn(`Exiting fullscreen failed: ${err.message}`));
             }
        }
    }
}


function populateFormatSelector() {
    formatSelect.innerHTML = ''; // Clear existing options
    for (const formatName in debateFormatDefinitions) {
        const option = document.createElement('option');
        option.value = formatName;
        option.textContent = formatName;
        formatSelect.appendChild(option);
    }
}
window.addEventListener('DOMContentLoaded', () => {
    populateFormatSelector();
    if (!SpeechRecognition) {
        alert("瀏覽器不支援 SpeechRecognition API");
        // Disable speech related UI elements if necessary
        // For example, hide speechAutoSettingsFieldset by default if it's not already
    }
    nextSegmentPreview.classList.add('hidden');
    timerProgressBarContainer.classList.add('hidden');
    fullscreenRealTimeClock.classList.add('hidden');

    // *** MODIFIED THEME LOADING ***
    const savedTheme = localStorage.getItem('debateTimerTheme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            applyTheme('dark');
        } else {
            applyTheme('light'); // Default to light if no preference or saved theme
        }
    }
    // *** END OF MODIFIED THEME LOADING ***

    const savedAutoMode = localStorage.getItem('debateAutoMode');
    if (savedAutoMode === 'true') {
        isAutoModeEnabled = true;
        autoModeToggle.checked = true;
    } else {
        isAutoModeEnabled = false;
        autoModeToggle.checked = false;
    }
    autoModeToggle.addEventListener('change', (event) => {
        isAutoModeEnabled = event.target.checked;
        localStorage.setItem('debateAutoMode', isAutoModeEnabled);
    });


    if(themeToggleButton) {
         themeToggleButton.addEventListener('click', toggleTheme);
    }
    if(shortcutHelpCloseButton) {
        shortcutHelpCloseButton.addEventListener('click', closeShortcutHelpModal);
    }
    addStageButton.addEventListener('click', () => openEditModal(-1)); // Default to add at end

    if (screen.orientation && typeof screen.orientation.addEventListener === 'function') {
         screen.orientation.addEventListener('change', handleOrientationChange);
    } else {
        console.warn("Screen Orientation API not fully supported, landscape auto-fullscreen might not work.");
    }

    // Global click listener to close "more actions" dropdowns
    document.body.addEventListener('click', function(event) {
        let clickedInsideDropdown = false;
        document.querySelectorAll('#flowEditorList .more-actions-dropdown').forEach(dropdown => {
            if (dropdown.contains(event.target) || (dropdown.previousElementSibling && dropdown.previousElementSibling.contains(event.target))) {
                clickedInsideDropdown = true;
            }
        });

        if (!clickedInsideDropdown) {
            document.querySelectorAll('#flowEditorList .more-actions-dropdown.active').forEach(openDropdown => {
                openDropdown.classList.remove('active');
            });
        }
    });

    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
            if ( (currentTimerType === 'grace' || currentTimerType === 'main' || currentTimerType === 'manual_prep') &&
                 timeLeft > 0 && !isTimerPaused && !screenWakeLockSentinel
            ) {
                await requestScreenWakeLock();
            }
        }
    });
});

editFlowButton.addEventListener('click', () => { 
    const selectedFormatName = formatSelect.value; 
    let flowToEdit; 
    // Check if the selected format is one of the base definitions or an already customized/imported one
    if (currentFlowDefinition && currentFlowDefinition.length > 0 && (selectedFormatName.includes("(自訂)") || selectedFormatName.startsWith("(匯入)"))) {
        // If a custom/imported flow is already selected and potentially modified in memory (but not yet saved as a new "自訂" variant),
        // we should edit the currentFlowDefinition.
        flowToEdit = JSON.parse(JSON.stringify(currentFlowDefinition));
    } else if (debateFormatDefinitions[selectedFormatName]) { 
        flowToEdit = JSON.parse(JSON.stringify(debateFormatDefinitions[selectedFormatName])); 
    } else { 
        alert("請先選擇一個有效的流程範本！"); 
        return; 
    } 
    originalFlowBeforeEdit = JSON.parse(JSON.stringify(flowToEdit)); // Store a pristine copy of what's being opened for editing
    currentFlowDefinition = flowToEdit; // This becomes the working copy for the editor
    setupPhaseDiv.classList.add('hidden'); 
    flowEditorSection.classList.remove('hidden'); 
    renderEditorList(); 
});
cancelEditingButton.addEventListener('click', () => { 
    if (confirm("取消編輯？所有未儲存的變更將會遺失。")) { 
        flowEditorSection.classList.add('hidden'); 
        setupPhaseDiv.classList.remove('hidden'); 
        // Revert currentFlowDefinition to what it was before editing started, or clear if it was a new edit from a base template.
        // If originalFlowBeforeEdit exists, it means we started editing something.
        // If not, it implies an issue or an edge case not fully handled.
        // For safety, try to reload the selected format if originalFlowBeforeEdit is null.
        const selectedFormatName = formatSelect.value;
        if (originalFlowBeforeEdit) {
            currentFlowDefinition = JSON.parse(JSON.stringify(originalFlowBeforeEdit));
        } else if (debateFormatDefinitions[selectedFormatName]) {
            currentFlowDefinition = JSON.parse(JSON.stringify(debateFormatDefinitions[selectedFormatName]));
        } else {
            currentFlowDefinition = []; // Fallback to empty if no reliable source
        }
        originalFlowBeforeEdit = null; // Clear the 'before edit' state
        // formatSelect.value = formatSelect.options[0].value; // Optionally reset dropdown, or keep current
    } 
});
finishEditingButton.addEventListener('click', () => { 
    // Determine a base name for the flow, removing existing suffixes
    let baseName = formatSelect.value;
    baseName = baseName.replace(/\s*\(自訂\)$/, "").replace(/\s*\(匯入\)\s*/, "");
    const editedFlowName = `${baseName} (自訂)`; 

    debateFormatDefinitions[editedFlowName] = JSON.parse(JSON.stringify(currentFlowDefinition)); 
    
    let optionExists = false;
    for (let i = 0; i < formatSelect.options.length; i++) {
        if (formatSelect.options[i].value === editedFlowName) {
            optionExists = true;
            formatSelect.options[i].textContent = editedFlowName; // Update text if name changed (e.g. base changed)
            break;
        }
    }
    if (!optionExists) {
        const option = document.createElement('option'); 
        option.value = editedFlowName; 
        option.textContent = editedFlowName; 
        formatSelect.appendChild(option); 
    }
    
    formatSelect.value = editedFlowName; 
    flowEditorSection.classList.add('hidden'); 
    setupPhaseDiv.classList.remove('hidden'); 
    alert(`流程 "${editedFlowName}" 已儲存並選取。`); 
    originalFlowBeforeEdit = null; // Editing is finished, clear this
});


confirmSetupButton.addEventListener('click', () => {
    const selectedFormatName = formatSelect.value;
    // If currentFlowDefinition is already populated (e.g., from import or edit), use it.
    // Otherwise, load from debateFormatDefinitions.
    if (!(currentFlowDefinition && currentFlowDefinition.length > 0 && (selectedFormatName.includes("(自訂)") || selectedFormatName.startsWith("(匯入)")))) {
        if (debateFormatDefinitions[selectedFormatName]) {
            currentFlowDefinition = JSON.parse(JSON.stringify(debateFormatDefinitions[selectedFormatName]));
        } else {
            alert("無法載入所選流程！請確認選擇或匯入流程。");
            return;
        }
    }


    positiveTeamName = positiveTeamNameInput.value.trim() || "正方";
    negativeTeamName = negativeTeamNameInput.value.trim() || "反方";
    debateTopic = debateTopicInput.value.trim() || "（未設定辯題）";
    let displayName = selectedFormatName.replace(/\s*\(自訂\)$/, "").replace(/\s*\(匯入\)\s*/, "");
    debateInfoDisplay.innerHTML = `<p><strong>流程：</strong>${displayName}</p><p><strong>辯題：</strong>${debateTopic}</p><p><strong>正方：</strong>${positiveTeamName} vs <strong>反方：</strong>${negativeTeamName}</p>`;
    setupPhaseDiv.classList.add('hidden');
    flowEditorSection.classList.add('hidden');
    debatePhaseDiv.classList.remove('hidden');
    nextStageButton.classList.remove('hidden');
    resetButton.classList.remove('hidden');
    currentStageIndex = -1;
    rebuttalOrder = null;
    loadNextStage();
});
startDrawButton.addEventListener('click', () => {
    playSound('drawSound');
    rebuttalOrder = Math.random() < 0.5 ? 'positive_first' : 'negative_first';
    const resultText = `抽籤結果：${rebuttalOrder === 'positive_first' ? positiveTeamName : negativeTeamName} 先結辯。`;
    drawResultDisplay.textContent = resultText;
    speak(resultText, () => {
        if (isAutoModeEnabled && currentStageIndex < currentFlowDefinition.length - 1) {
            setTimeout(() => {
                if (currentFlowDefinition[currentStageIndex]?.type === 'draw_rebuttal_order' && !isTimerPaused ) { 
                    loadNextStage();
                }
            }, 2000);
        } else {
            nextStageButton.disabled = false;
        }
    });
    startDrawButton.disabled = true;
});
nextStageButton.addEventListener('click', () => { if (synth.speaking) synth.cancel(); loadNextStage(); });
manualStartTimerButton.addEventListener('click', () => { const stage = currentFlowDefinition[currentStageIndex]; if (stage && stage.type === "manual_prep") startManualPrepTimer(stage.duration); });

forceStartMainTimerButton.addEventListener('click', () => {
    const currentStage = currentFlowDefinition[currentStageIndex];
    if (!currentStage) return;

    if (currentTimerType === 'grace' && timeLeft > 0) { // Forcing start during grace period
        if (graceTimerInterval) {
            clearTimeout(graceTimerInterval); // Note: setInterval returns an ID, clearInterval is used. If using setTimeout, then clearTimeout.
            graceTimerInterval = null;
        }
        stopRecognitionForce();
        timerStatusDisplay.textContent = "手動啟動...";
        speak("手動啟動，計時開始。", () => {
            startMainSpeechTimer(currentStage.duration);
            pauseResumeTimerButton.classList.remove('hidden');
            pauseResumeTimerButton.textContent = "暫停計時";
            skipStageButton.classList.add('hidden'); // Hide skip when timer is running
        });
        mainSpeechTimerStartedByGrace = true; // Mark that main timer was started (even if manually from grace)
    } else if (currentStage.type === 'speech_auto' && 
               currentStage.graceEndAction === 'manual_start' && 
               (currentTimerType === 'grace' || !currentTimerType) && // Can be after grace ended or if grace was skipped
               timeLeft <= 0 && !mainSpeechTimerStartedByGrace) { // After grace time ended, and manual_start was the action
        timerStatusDisplay.textContent = "手動啟動主要計時...";
        speak("手動啟動，計時開始。", () => {
            startMainSpeechTimer(currentStage.duration);
            pauseResumeTimerButton.classList.remove('hidden');
            pauseResumeTimerButton.textContent = "暫停計時";
            skipStageButton.classList.add('hidden');
            forceStartMainTimerButton.classList.add('hidden'); // Hide after starting
        });
        mainSpeechTimerStartedByGrace = true; // Mark that main timer was started
    }
});

exportFlowButton.addEventListener('click', () => { 
    const selectedFormatName = formatSelect.value; 
    let flowToExport = null; 
    let flowName = selectedFormatName; 
    
    // Prioritize currentFlowDefinition if it's a custom/imported flow or currently being edited
    if(currentFlowDefinition && currentFlowDefinition.length > 0 && 
       (selectedFormatName.includes("(自訂)") || selectedFormatName.startsWith("(匯入)") || flowEditorSection.style.display !== 'none')) { 
        flowToExport = currentFlowDefinition; 
        // Refine flowName for export if it's from currentFlowDefinition
        if (flowEditorSection.style.display !== 'none' && originalFlowBeforeEdit) {
             // If editor is open, use the name of the flow being edited as base
             let baseName = formatSelect.value.replace(/\s*\(自訂\)$/, "").replace(/\s*\(匯入\)\s*/, "");
             flowName = `${baseName}_edited_unsaved`; // Or some indicator it's the current editor content
        } else {
            flowName = selectedFormatName; // Use the selected name if not actively editing or if it's already custom/imported
        }
    } else if (debateFormatDefinitions[selectedFormatName]) { 
        flowToExport = debateFormatDefinitions[selectedFormatName]; 
        flowName = selectedFormatName; 
    } 
    
    if (!flowToExport || flowToExport.length === 0) { 
        alert("沒有可匯出的流程！請先選擇或編輯一個有效的流程。"); 
        return; 
    } 
    
    const jsonString = JSON.stringify(flowToExport, null, 2); 
    const blob = new Blob([jsonString], { type: 'application/json' }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    const sanitizedFlowName = flowName.replace(/[^\w\s\-_ㄱ-ㅎㅏ-ㅣ가-힣一-龥]/g, '_'); // Sanitize more broadly
    const fileName = sanitizedFlowName.replace(/[\s()]/g, '_').replace('(匯入)_', 'Imported_').replace('_(自訂)','_Custom') + ".json"; 
    a.download = fileName; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
    fileImportStatus.textContent = `流程 "${flowName}" 已匯出為 ${fileName}`; 
    fileImportStatus.classList.remove('error'); 
    fileImportStatus.classList.add('success'); 
});
importFlowInput.addEventListener('change', (event) => { 
    const file = event.target.files[0]; 
    if (!file) { 
        fileImportStatus.textContent = "未選擇檔案。"; 
        fileImportStatus.className = 'import-status error'; // Add error class
        loadImportedFlowButton.classList.add('hidden'); 
        return; 
    } 
    if (file.type !== "application/json") { 
        fileImportStatus.textContent = "錯誤：請選擇 .json 檔案。"; 
        fileImportStatus.className = 'import-status error';
        loadImportedFlowButton.classList.add('hidden'); 
        importedDebateStages = null; 
        importFlowInput.value = ""; // Reset file input
        return; 
    } 
    const reader = new FileReader(); 
    reader.onload = (e) => { 
        try { 
            const parsedFlow = JSON.parse(e.target.result); 
            // Basic validation: is it an array, not empty, and items look like stages?
            if (Array.isArray(parsedFlow) && parsedFlow.length > 0 && 
                parsedFlow.every(stage => typeof stage === 'object' && stage !== null && stage.name && stage.type)) { 
                importedDebateStages = parsedFlow; 
                importedDebateStages.fileName = file.name.replace(/\.json$/i, ""); // Store sanitized filename
                fileImportStatus.textContent = `檔案 "${file.name}" 已成功讀取。`; 
                fileImportStatus.className = 'import-status success'; // Add success class
                loadImportedFlowButton.classList.remove('hidden'); 
                loadImportedFlowButton.textContent = `載入 "${importedDebateStages.fileName}" 並設為目前流程`; 
            } else { 
                throw new Error("JSON 結構不符或內容不完整。"); 
            } 
        } catch (error) { 
            console.error("Error parsing JSON:", error); 
            fileImportStatus.textContent = `錯誤：無法解析檔案。${error.message}`; 
            fileImportStatus.className = 'import-status error';
            loadImportedFlowButton.classList.add('hidden'); 
            importedDebateStages = null; 
        } 
    }; 
    reader.onerror = () => { 
        fileImportStatus.textContent = "讀取檔案錯誤。"; 
        fileImportStatus.className = 'import-status error';
        loadImportedFlowButton.classList.add('hidden'); 
        importedDebateStages = null; 
    }; 
    reader.readAsText(file); 
});
loadImportedFlowButton.addEventListener('click', () => { 
    if (importedDebateStages) { 
        const importName = `(匯入) ${importedDebateStages.fileName || "未命名流程"}`; 
        debateFormatDefinitions[importName] = JSON.parse(JSON.stringify(importedDebateStages)); // Add to definitions
        currentFlowDefinition = JSON.parse(JSON.stringify(importedDebateStages)); // Set as current working flow

        let optionExists = false;
        for(let i=0; i < formatSelect.options.length; i++) {
            if(formatSelect.options[i].value === importName) {
                optionExists = true;
                break;
            }
        }
        if (!optionExists) {
            const option = document.createElement('option'); 
            option.value = importName; 
            option.textContent = importName; 
            formatSelect.appendChild(option); 
        }
        formatSelect.value = importName; // Select the newly imported flow

        fileImportStatus.textContent = `流程 "${importName}" 已新增至選單、選取並載入為目前流程。`; 
        fileImportStatus.className = 'import-status success';
        loadImportedFlowButton.classList.add('hidden'); 
        importedDebateStages = null; // Clear the temporary storage
        originalFlowBeforeEdit = JSON.parse(JSON.stringify(currentFlowDefinition)); // Set for potential editing
        importFlowInput.value = ""; // Reset file input
    } else { 
        fileImportStatus.textContent = "沒有可載入的匯入流程。"; 
        fileImportStatus.className = 'import-status error';
    }
});

resetButton.addEventListener('click', () => {
    if(!confirm("確定要重置所有設定並返回初始畫面嗎？")) return;
    releaseScreenWakeLock();
    stopRecognitionForce();
    if (synth.speaking) synth.cancel();
    clearAllTimersAndIntervals();
    currentStageIndex = -1;
    rebuttalOrder = null;
    currentFlowDefinition = [];
    originalFlowBeforeEdit = null;
    moderatorScriptDisplay.textContent = "請按「確認設定」開始。";
    currentStageInfoDisplay.textContent = "";
    timerDisplay.classList.add('hidden');
    timerDisplay.classList.remove('warning1min', 'warning30sec', 'timesup'); // Clear color classes
    timerStatusDisplay.textContent = "";
    drawResultDisplay.textContent = "";
    timerDisplay.textContent = "00:00";

    isAutoModeEnabled = false; 
    autoModeToggle.checked = false;
    localStorage.setItem('debateAutoMode', 'false');

    // Reset timer display color based on current theme/fullscreen status
    handleFullscreenChange(); 

    debatePhaseDiv.classList.add('hidden');
    drawRebuttalOrderSection.classList.add('hidden');
    flowEditorSection.classList.add('hidden');
    setupPhaseDiv.classList.remove('hidden');
    nextStageButton.classList.add('hidden');
    resetButton.classList.add('hidden');
    manualStartTimerButton.classList.add('hidden');
    forceStartMainTimerButton.classList.add('hidden');
    speechRecognitionStatusDisplay.textContent = "";
    speechRecognitionStatusDisplay.classList.add('hidden');
    pauseResumeTimerButton.classList.add('hidden');
    skipStageButton.classList.add('hidden');
    nextStageButton.disabled = false;
    manualStartTimerButton.disabled = false;
    startDrawButton.disabled = false;
    debateInfoDisplay.innerHTML = "";
    fileImportStatus.textContent = "";
    fileImportStatus.className = 'import-status'; // Reset class
    importFlowInput.value="";
    loadImportedFlowButton.classList.add('hidden');
    importedDebateStages = null;
    positiveTeamNameInput.value = "正方";
    negativeTeamNameInput.value = "反方";
    debateTopicInput.value = "（在此輸入辯題）";
    if (formatSelect.options.length > 0) formatSelect.selectedIndex = 0; // Reset to first option
    timerProgressBarContainer.classList.add('hidden');
    nextSegmentPreview.textContent = "";
    nextSegmentPreview.classList.add('hidden');
});

function toggleFullscreen() { 
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) { 
        const el = document.documentElement;
        if (el.requestFullscreen) el.requestFullscreen().catch(err => console.error("FS Err:", err));
        else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen().catch(err => console.error("FS Err:", err));
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen().catch(err => console.error("FS Err:", err));
        else if (el.msRequestFullscreen) el.msRequestFullscreen().catch(err => console.error("FS Err:", err));
    } else { 
        if (document.exitFullscreen) document.exitFullscreen().catch(err => console.error("FS Err:", err));
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(err => console.error("FS Err:", err));
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen().catch(err => console.error("FS Err:", err));
        else if (document.msExitFullscreen) document.msExitFullscreen().catch(err => console.error("FS Err:", err));
    } 
}

function handleFullscreenChange() {
    const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    bodyElement.classList.toggle('fullscreen-active', isCurrentlyFullscreen);
    fullscreenButton.textContent = isCurrentlyFullscreen ? '退出全螢幕' : '進入全螢幕';

    if (isCurrentlyFullscreen) {
        fullscreenRealTimeClock.classList.remove('hidden');
        updateRealTimeClock(); // Initial update
        if (!realTimeClockInterval) {
            realTimeClockInterval = setInterval(updateRealTimeClock, 1000);
        }
    } else {
        fullscreenRealTimeClock.classList.add('hidden');
        if (realTimeClockInterval) {
            clearInterval(realTimeClockInterval);
            realTimeClockInterval = null;
        }
    }

    // Update timer text color based on current theme and fullscreen state
    // The actual color values will come from CSS variables.
    // We just ensure the classes are correctly applied or removed if necessary.
    // The runActiveTimerInterval function will add/remove warning/timesup classes.
    // This function ensures the base color is correct after a fullscreen or theme change.
    if (!timerDisplay.classList.contains('warning1min') && 
        !timerDisplay.classList.contains('warning30sec') && 
        !timerDisplay.classList.contains('timesup')) {
        // If no specific warning state, the color is purely theme/fullscreen dependent via CSS
    }

    // Update progress bar colors (already handled by updateProgressBar based on isFullscreen)
    if (initialTimerDuration > 0 && timeLeft !== undefined) {
        updateProgressBar(timeLeft, initialTimerDuration); 
    } else {
        // Default progress bar color if no timer active
        timerProgressBar.style.backgroundColor = isCurrentlyFullscreen 
            ? '#259DFA' /* Example fixed color for fullscreen default */
            : getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
        if (isCurrentlyFullscreen) timerProgressBar.removeAttribute('data-color-state');
    }
}

fullscreenButton.addEventListener('click', toggleFullscreen);
// Listen to all vendor-prefixed fullscreen change events
['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
    document.addEventListener(event, handleFullscreenChange);
});


window.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement;
    const isTyping = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'SELECT' || activeElement.isContentEditable);

    if (event.key === 'Escape') {
        if (shortcutHelpModal.style.display === "flex") { // Check for flex as it's used to show
            closeShortcutHelpModal();
            event.preventDefault();
        } else if (stageEditModal.style.display === "flex") { // Check for flex
            closeModal();
            event.preventDefault();
        } else if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
            toggleFullscreen(); // Exit fullscreen on Escape
            event.preventDefault();
        }
        return;
    }

    if (event.key === '/') {
        if (!isTyping) {
            if (shortcutHelpModal.style.display === "flex") {
                closeShortcutHelpModal();
            } else {
                showShortcutHelpModal();
            }
            event.preventDefault();
        }
        return;
    }

    if (isTyping && !['Enter', 'Escape'].includes(event.key) ) return; // Allow Enter/Escape even if typing for modal submission/closing

    // Prevent shortcuts if a modal is open, unless it's Escape or Enter for modal actions
    if ((stageEditModal.style.display === "flex" || shortcutHelpModal.style.display === "flex") && 
        !['Escape', 'Enter'].includes(event.key) && 
        !(activeElement.closest('.modal-content') && ['ArrowUp', 'ArrowDown', 'Tab'].includes(event.key)) // Allow navigation within modal
    ) {
        return;
    }


    switch (event.key.toLowerCase()) {
        case 'n':
        case 'arrowright':
            if (nextStageButton && !nextStageButton.classList.contains('hidden') && !nextStageButton.disabled) {
                nextStageButton.click();
                event.preventDefault();
            }
            break;
        case 'p':
        case ' ': // Spacebar
            if (pauseResumeTimerButton && !pauseResumeTimerButton.classList.contains('hidden')) {
                pauseResumeTimerButton.click();
                event.preventDefault();
            }
            break;
        case 's':
            if (manualStartTimerButton && !manualStartTimerButton.classList.contains('hidden') && !manualStartTimerButton.disabled) {
                manualStartTimerButton.click();
                event.preventDefault();
            } else if (forceStartMainTimerButton && !forceStartMainTimerButton.classList.contains('hidden')) {
                forceStartMainTimerButton.click();
                event.preventDefault();
            } else if (startDrawButton && !startDrawButton.classList.contains('hidden') && !startDrawButton.disabled) {
                startDrawButton.click();
                event.preventDefault();
            }
            break;
        case 'r':
            if (resetButton && !resetButton.classList.contains('hidden')) {
                resetButton.click();
                event.preventDefault();
            }
            break;
        case 'f':
            if (fullscreenButton) {
                fullscreenButton.click();
                event.preventDefault();
            }
            break;
        case 't':
             if (themeToggleButton) {
                themeToggleButton.click();
                event.preventDefault();
            }
            break;
        case 'enter':
            // Handle Enter key for confirming setup or finishing editing if applicable
            if (confirmSetupButton && !confirmSetupButton.classList.contains('hidden') && setupPhaseDiv.style.display !== 'none' && !flowEditorSection.classList.contains('hidden')) {
                // Only if confirm button is visible and setup phase is active
                // Check if focus is on an input field to avoid submitting forms unintentionally if that's not desired.
                // For simplicity, this example assumes Enter on setup phase means confirm.
                // confirmSetupButton.click();
                // event.preventDefault();
            } else if (finishEditingButton && !finishEditingButton.classList.contains('hidden') && flowEditorSection.style.display !== 'none') {
                // If focus is on a button in the modal, Enter usually triggers it.
                // This is more for global Enter if not focused.
                // finishEditingButton.click();
                // event.preventDefault();
            } else if (stageEditModal.style.display === "flex" && document.activeElement.tagName !== 'TEXTAREA') {
                // If modal is open and not typing in textarea, try to save.
                const saveBtn = stageEditModal.querySelector('.btn-primary'); // Assuming save is primary
                if (saveBtn) {
                    // saveBtn.click(); // This might be too aggressive, user might be tabbing
                }
            }
            break;
    }
});

// Click outside modal to close
window.onclick = function(event) {
    if (event.target == stageEditModal && stageEditModal.style.display === "flex") { // Check if modal is visible
         closeModal();
    } else if (event.target == shortcutHelpModal && shortcutHelpModal.style.display === "flex") {
        closeShortcutHelpModal();
    }
}