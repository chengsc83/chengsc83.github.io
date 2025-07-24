// --- DOM Elements ---
// Corrected and consolidated DOM element selection
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
const audioElements = {
    warningSound1min: document.getElementById('warningSound1min'),
    warningSound30sec: document.getElementById('warningSound30sec'),
    timesUpSound: document.getElementById('timesUpSound'),
    stageAdvanceSound: document.getElementById('stageAdvanceSound'),
    speechDetectedSound: document.getElementById('speechDetectedSound'),
    drawSound: document.getElementById('drawSound')
};
const editFlowButton = document.getElementById('editFlowButton');
const flowEditorSection = document.getElementById('flowEditorSectionV2');
const flowEditorList = document.getElementById('flowEditorListV2');
const finishEditingButton = document.getElementById('finishEditingButtonV2');
const cancelEditingButton = document.getElementById('cancelEditingButtonV2');
const timerProgressBarContainer = document.getElementById('timerProgressBarContainer');
const timerProgressBar = document.getElementById('timerProgressBar');
const nextSegmentPreview = document.getElementById('nextSegmentPreview');
const bodyElement = document.body;
const shortcutHelpModal = document.getElementById('shortcutHelpModal');
const shortcutHelpFooterButton = document.getElementById('shortcutHelpButton');
const fullscreenRealTimeClock = document.getElementById('fullscreenRealTimeClock');
const autoModeToggle = document.getElementById('autoModeToggle');

// Hamburger Menu Elements
const hamburgerButton = document.getElementById('hamburgerButton');
const hamburgerMenu = document.getElementById('hamburgerMenu');
const closeMenuButton = document.getElementById('closeMenuButton');
const menuOverlay = hamburgerMenu?.querySelector('.menu-overlay');
const menuThemeToggle = document.getElementById('menuThemeToggle');
const menuAutoModeInput = document.getElementById('menuAutoModeInput');
const menuFullscreen = document.getElementById('menuFullscreen');
const menuHelp = document.getElementById('menuHelp');
const themeStatusBadge = document.getElementById('themeStatusBadge');
const upgradeButton = document.getElementById('upgradeButton');
const upgradeButtonMobile = document.getElementById('upgradeButtonMobile');


// New Sidebar Editor Elements
const stageEditSidebar = document.getElementById('stageEditSidebar');
const sidebarTitle = document.getElementById('sidebarTitle');
const sidebarContent = document.getElementById('sidebarContent');
const saveSidebarBtn = document.getElementById('saveSidebarBtn');
const cancelSidebarBtn = document.getElementById('cancelSidebarBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');

// New elements for 辯革盃
const stageChoiceModal = document.getElementById('stageChoiceModal');
const stageChoiceModalTitle = document.getElementById('stageChoiceModalTitle');
const stageActionTypeSelect = document.getElementById('stageActionTypeSelect');
const stagePlayerSelect = document.getElementById('stagePlayerSelect');
const confirmStageChoiceButton = document.getElementById('confirmStageChoiceButton');

// --- State Variables ---
let positiveTeamName = "正方";
let negativeTeamName = "反方";
let debateTopic = "（在此輸入辯題）";
let rebuttalOrder = null;
let currentStageIndex = -1;
let timerInterval;
let graceTimerInterval;
let timeLeft;
let isTimerPaused = false;
let currentTimerType = null;
let synth = window.speechSynthesis;
let voices = [];
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecognizing = false;
let recognitionManuallyStopped = false;
let mainSpeechTimerStartedByGrace = false;
const DEFAULT_GRACE_PERIOD_DURATION = 60;
let importedDebateStages = null;
let currentFlowDefinition = [];
let originalFlowBeforeEdit = null;
let initialTimerDuration = 0;
let editingStageIndex = -1;
let realTimeClockInterval = null;
let isAutoModeEnabled = false;
let screenWakeLockSentinel = null;
let isManualAdvance = false;
let positiveTeamPlayers = ["正方一辯", "正方二辯", "正方三辯"];
let negativeTeamPlayers = ["反方一辯", "反方二辯", "反方三辯"];
let currentStageSelectedPlayer = null;
let currentStageSelectedActionType = null;
let isStageChoiceModalOpen = false;

const stageIcons = {
    announcement: '📢',
    draw_rebuttal_order: '🎲',
    manual_prep: '⏱️',
    speech_auto: '🎤',
    choice_speech: '🗣️'
};


// 辯論格式定義
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
    ],
    "辯革盃 (九辯位自由排序制)": [
        { name: "賽前準備及介紹", type: "announcement", script: "歡迎各位來到辯革盃練習賽。本次比賽辯題為：「{{debate_topic}}」。\n正方代表隊：{{positive_team_name}} (選手：{{positive_team_players_list}})。\n反方代表隊：{{negative_team_name}} (選手：{{negative_team_players_list}})。\n首先為您介紹本場比賽裁判...", timerLabel: null },
        { name: "賽制說明", type: "announcement", script: "本次比賽採「辯革盃九辯位自由排序制」，每一輪次皆為四分半。主席將於三分三十秒時按鈴一響，四分整時按鈴兩響，四分半時按鈴三響，屆時請台上辯士停止發言。", timerLabel: null },
        { name: "開賽預備", type: "manual_prep", duration: 60, script: "比賽將於鈴響一分鐘後開始，請雙方準備。", timerLabel: "開賽準備" },
        { name: "正方立論", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['立論'], duration: 270, baseScript: "請正方 {{selected_player}} 上台進行立論，時間四分三十秒。有請。", baseTimerLabel: "正方立論 ({{selected_player}})" },
        { name: "反方立論", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['立論'], duration: 270, baseScript: "請反方 {{selected_player}} 上台進行立論，時間四分三十秒。有請。", baseTimerLabel: "反方立論 ({{selected_player}})" },
        { name: "感謝雙方立論", type: "announcement", script: "感謝雙方的立論。", timerLabel: null },
        { name: "正方接替環節 1", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請正方決定此環節。請正方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "正方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝正方", type: "announcement", script: "感謝正方辯士。", timerLabel: null },
        { name: "反方接替環節 1", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請反方決定此環節。請反方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "反方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝反方", type: "announcement", script: "感謝反方辯士。", timerLabel: null },
        { name: "正方接替環節 2", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請正方決定此環節。請正方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "正方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝正方", type: "announcement", script: "感謝正方辯士。", timerLabel: null },
        { name: "反方接替環節 2", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請反方決定此環節。請反方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "反方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝反方", type: "announcement", script: "感謝反方辯士。", timerLabel: null },
        { name: "正方接替環節 3", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請正方決定此環節。請正方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "正方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝正方", type: "announcement", script: "感謝正方辯士。", timerLabel: null },
        { name: "反方接替環節 3", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請反方決定此環節。請反方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "反方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝反方", type: "announcement", script: "感謝反方辯士。", timerLabel: null },
        { name: "正方接替環節 4", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請正方決定此環節。請正方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "正方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝正方", type: "announcement", script: "感謝正方辯士。", timerLabel: null },
        { name: "反方接替環節 4", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請反方決定此環節。請反方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "反方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝反方", type: "announcement", script: "感謝反方辯士。", timerLabel: null },
        { name: "正方接替環節 5", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請正方決定此環節。請正方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "正方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝正方", type: "announcement", script: "感謝正方辯士。", timerLabel: null },
        { name: "反方接替環節 5", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請反方決定此環節。請反方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "反方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝反方", type: "announcement", script: "感謝反方辯士。", timerLabel: null },
        { name: "正方接替環節 6", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請正方決定此環節。請正方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "正方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝正方", type: "announcement", script: "感謝正方辯士。", timerLabel: null },
        { name: "反方接替環節 6", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, baseScript: "請反方決定此環節。請反方 {{selected_player}} 上台進行 {{selected_action_type}}，時間四分三十秒。有請。", baseTimerLabel: "反方 {{selected_action_type}} ({{selected_player}})" },
        { name: "感謝反方", type: "announcement", script: "感謝反方辯士。", timerLabel: null },
        { name: "比賽環節結束", type: "announcement", script: "比賽環節到此結束。感謝雙方隊伍帶來一場精彩的比賽。", timerLabel: null },
        { name: "裁判講評與宣布結果", type: "announcement", script: "接下來讓我們欣賞裁判講評，並宣布比賽結果。（此部分請主席參照實際情況口述）", timerLabel: null },
        { name: "比賽正式結束", type: "announcement", script: "本場比賽到此結束。感謝各位的參與！", timerLabel: null }
    ]
};

// --- i18n Functions ---
// NOTE: This version does not include i18n functions as they are complex and might not be the root cause.
// A simplified approach is taken for now to ensure functionality.
const translations = {}; // Placeholder
async function fetchTranslations(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (e) {
        console.error(`Could not load translation file for language: ${lang}`, e);
        return {}; // Return empty object on failure
    }
}
async function loadTranslations() {
    const langs = ['zh-TW', 'en'];
    for (const lang of langs) {
        translations[lang] = await fetchTranslations(lang);
    }
    refreshUIText('zh-TW'); // Default to zh-TW
}
function geti18nValue(key, options = {}, lang = 'zh-TW') {
    const langPack = translations[lang] || {};
    const keys = key.split('.');
    let text = keys.reduce((obj, k) => (obj && obj[k] !== 'undefined') ? obj[k] : undefined, langPack);
    if (text === undefined) text = key;
    if (typeof text !== 'string') return key;
    if (options && typeof options === 'object') {
        for (const placeholder in options) {
            if (Object.prototype.hasOwnProperty.call(options, placeholder)) {
                text = text.replace(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'), options[placeholder]);
            }
        }
    }
    return text;
}
function refreshUIText(lang) {
    // This is a simplified version. A full implementation would update all text content.
    populateFormatSelector();
}


// --- Screen Wake Lock Functions ---
async function requestScreenWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            screenWakeLockSentinel = await navigator.wakeLock.request('screen');
            screenWakeLockSentinel.addEventListener('release', () => {
                screenWakeLockSentinel = null;
            });
        } catch (err) {
            console.error(`Screen Wake Lock request failed: ${err.name}, ${err.message}`);
        }
    }
}

async function releaseScreenWakeLock() {
    if (screenWakeLockSentinel) {
        await screenWakeLockSentinel.release();
        screenWakeLockSentinel = null;
    }
}

// --- Utility Functions ---
function playSound(soundName) {
    const audio = audioElements[soundName];
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(error => console.warn(`Error playing sound "${soundName}":`, error.message));
    }
}

function populateVoiceList() {
    voices = synth.getVoices().filter(voice => voice.lang.startsWith('zh'));
    if (voices.length === 0) voices = synth.getVoices();
}

function speak(text, callback) {
    if (!text) {
        if (callback) callback();
        return;
    }
    if (synth.speaking) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => {
        if (callback) callback();
    };
    u.onerror = (event) => {
        console.warn('SpeechSynErr:', event.error);
        if (callback) callback();
    };
    let v = voices.find(vo => vo.lang === 'zh-TW' || vo.lang === 'zh-CN') || voices.find(vo => vo.lang.startsWith('zh'));
    if (v) u.voice = v;
    else if (voices.length > 0) u.voice = voices[0];
    synth.speak(u);
}

function interpolateScript(script, options = {}) {
    if (!script) return "";
    let firstTeam = "",
        secondTeam = "";
    if (rebuttalOrder) {
        firstTeam = rebuttalOrder === 'positive_first' ? positiveTeamName : negativeTeamName;
        secondTeam = rebuttalOrder === 'positive_first' ? negativeTeamName : positiveTeamName;
    }
    const posPlayersList = positiveTeamPlayers.join(', ') || "未指定選手";
    const negPlayersList = negativeTeamPlayers.join(', ') || "未指定選手";

    const replacements = {
        positive_team_name: positiveTeamName,
        negative_team_name: negativeTeamName,
        debate_topic: debateTopic,
        first_rebuttal_team_name: firstTeam,
        second_rebuttal_team_name: secondTeam,
        positive_team_players_list: posPlayersList,
        negative_team_players_list: negPlayersList,
        selected_player: currentStageSelectedPlayer || '',
        selected_action_type: currentStageSelectedActionType || '',
        ...options
    };

    let result = script;
    for (const placeholder in replacements) {
        const regex = new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g');
        result = result.replace(regex, replacements[placeholder]);
    }
    return result;
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateTimerDisplayDOM(currentTime) {
    timerDisplay.textContent = formatTime(currentTime);
}

function updateProgressBar(currentTime, totalDuration) {
    if (timerProgressBarContainer && !timerProgressBarContainer.classList.contains('hidden')) {
        const percentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;
        timerProgressBar.style.width = `${percentage}%`;
        
        if (currentTime <= 0) {
            timerProgressBar.style.backgroundColor = 'var(--danger-500)';
        } else if (currentTime <= 30) {
            timerProgressBar.style.backgroundColor = 'var(--warning-500)';
        } else if (currentTime <= 60) {
             timerProgressBar.style.backgroundColor = 'var(--info-500)';
        } else {
            timerProgressBar.style.backgroundColor = 'var(--primary-500)';
        }
    }
}


function startRecognitionConditionally() {
    if (SpeechRecognition && recognition && !isRecognizing && currentTimerType === 'grace' && !isTimerPaused) {
        recognitionManuallyStopped = false;
        try {
            recognition.start();
        } catch (e) {
            console.error("SR start err:", e);
            if(speechRecognitionStatusDisplay) speechRecognitionStatusDisplay.textContent = "語音識別啟動失敗";
        }
    }
}

function stopRecognitionForce() {
    recognitionManuallyStopped = true;
    if (SpeechRecognition && recognition && isRecognizing) {
        try {
            recognition.stop();
        } catch (e) {
            if (e.name !== 'InvalidStateError') {
                console.error("SR stop err:", e);
            }
        }
    }
    isRecognizing = false;
}

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'zh-TW';

    recognition.onstart = () => {
        isRecognizing = true;
        recognitionManuallyStopped = false;
        if(speechRecognitionStatusDisplay) speechRecognitionStatusDisplay.textContent = "語音識別已啟動...";
    };
    recognition.onresult = (event) => {
        if (currentTimerType === 'grace' && graceTimerInterval && !mainSpeechTimerStartedByGrace && !isTimerPaused) {
            clearTimeout(graceTimerInterval);
            graceTimerInterval = null;
            if(forceStartMainTimerButton) forceStartMainTimerButton.classList.add('hidden');
            if(skipStageButton) skipStageButton.classList.add('hidden');
            if(timerStatusDisplay) timerStatusDisplay.textContent = "偵測到語音...";
            speak("偵測到語音，自動開始計時", () => startMainSpeechTimer(currentFlowDefinition[currentStageIndex].duration));
            playSound('speechDetectedSound');
            mainSpeechTimerStartedByGrace = true;
        }
    };
    recognition.onerror = (event) => {
        isRecognizing = false;
        let msg = `服務錯誤: ${event.error}`;
        if (event.error === 'no-speech') msg = "未偵測到語音。";
        else if (event.error === 'not-allowed') alert("麥克風權限未授予。");
        
        if(speechRecognitionStatusDisplay) speechRecognitionStatusDisplay.textContent = msg;
    };
    recognition.onend = () => {
        isRecognizing = false;
        if (currentTimerType === 'grace' && !isTimerPaused && graceTimerInterval && !recognitionManuallyStopped) {
            setTimeout(startRecognitionConditionally, 250);
        }
    };
} else {
    if(speechRecognitionStatusDisplay) speechRecognitionStatusDisplay.textContent = "瀏覽器不支援 SpeechRecognition API";
}

function clearAllTimersAndIntervals() {
    releaseScreenWakeLock();
    clearInterval(timerInterval);
    clearInterval(graceTimerInterval);
    timerInterval = null;
    graceTimerInterval = null;
    isTimerPaused = false;
    currentTimerType = null;
    if(pauseResumeTimerButton) {
        pauseResumeTimerButton.textContent = "暫停";
        pauseResumeTimerButton.classList.add('hidden');
    }
    if(skipStageButton) skipStageButton.classList.add('hidden');
    if(forceStartMainTimerButton) forceStartMainTimerButton.classList.add('hidden');
    if(timerProgressBar) timerProgressBar.style.width = '0%';
    if(timerProgressBarContainer) timerProgressBarContainer.classList.add('hidden');
}

function runActiveTimerInterval() {
    if (isTimerPaused) return;
    timeLeft--;
    updateTimerDisplayDOM(timeLeft);
    updateProgressBar(timeLeft, initialTimerDuration);
    
    const endedStageIndex = currentStageIndex;
    const checkTimeUp = () => {
        clearInterval(timerInterval);
        timerInterval = null;
        playSound('timesUpSound');
        timerDisplay.textContent = "時間到";
        timerDisplay.classList.add('timesup');
        currentTimerType = null;
        releaseScreenWakeLock();
        if (endedStageIndex >= currentFlowDefinition.length - 1) {
            if(nextStageButton) nextStageButton.disabled = true;
        } else {
            if (isAutoModeEnabled) {
                if(timerStatusDisplay) timerStatusDisplay.textContent = "時間到，準備下一階段...";
                setTimeout(() => {
                    if (currentStageIndex === endedStageIndex && !isTimerPaused && !timerInterval && !graceTimerInterval) {
                        loadNextStage();
                    }
                }, 2000);
            } else {
                if(nextStageButton) nextStageButton.disabled = false;
            }
        }
    };

    if (currentTimerType === 'grace') {
        if (timeLeft <= 0) {
            clearTimeout(graceTimerInterval);
            graceTimerInterval = null;
            stopRecognitionForce();
            if(forceStartMainTimerButton) forceStartMainTimerButton.classList.add('hidden');
            if (!mainSpeechTimerStartedByGrace) {
                const currentStage = currentFlowDefinition[currentStageIndex];
                const graceEndAction = currentStage.graceEndAction || 'auto_start';
                switch (graceEndAction) {
                    case 'auto_start':
                        if(timerStatusDisplay) timerStatusDisplay.textContent = "緩衝時間到";
                        speak("緩衝時間到，自動開始計時", () => startMainSpeechTimer(currentStage.duration));
                        mainSpeechTimerStartedByGrace = true;
                        break;
                    case 'manual_start':
                        if(timerStatusDisplay) timerStatusDisplay.textContent = "緩衝時間到，請手動開始";
                        speak("緩衝時間到，請手動開始計時");
                        if(forceStartMainTimerButton) {
                             forceStartMainTimerButton.classList.remove('hidden');
                             forceStartMainTimerButton.textContent = "開始主要計時";
                        }
                        if(nextStageButton) nextStageButton.disabled = true;
                        if(pauseResumeTimerButton) pauseResumeTimerButton.classList.add('hidden');
                        break;
                    case 'auto_skip':
                        if(timerStatusDisplay) timerStatusDisplay.textContent = "緩衝時間到，自動跳過";
                        speak("緩衝時間到，自動跳過本階段", () => {
                            if (isAutoModeEnabled || currentStage.graceEndAction === 'auto_skip') {
                                loadNextStage();
                            }
                        });
                        break;
                }
            }
        }
    } else if (currentTimerType === 'main' || currentTimerType === 'manual_prep') {
        const d = initialTimerDuration;
        if (timeLeft === 60 && d > 60) {
            speak("剩餘1分鐘");
            playSound('warningSound1min');
        } else if (timeLeft === 30 && d > 30) {
            speak("剩餘30秒");
            playSound('warningSound30sec');
        } else if (timeLeft <= 0) {
            speak("時間到");
            checkTimeUp();
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
    const graceDuration = (typeof currentStage.graceDuration === 'number' && currentStage.graceDuration >= 0) ? currentStage.graceDuration : DEFAULT_GRACE_PERIOD_DURATION;
    timeLeft = graceDuration;
    initialTimerDuration = graceDuration;
    if(timerStatusDisplay) timerStatusDisplay.textContent = `準備 ${formatTime(graceDuration)}`;
    updateTimerDisplayDOM(timeLeft);
    if(timerDisplay) timerDisplay.classList.remove('hidden', 'warning1min', 'warning30sec', 'timesup');
    if(timerProgressBarContainer) timerProgressBarContainer.classList.remove('hidden');
    updateProgressBar(timeLeft, initialTimerDuration);
    if(speechRecognitionStatusDisplay) speechRecognitionStatusDisplay.classList.remove('hidden');
    if(forceStartMainTimerButton) forceStartMainTimerButton.classList.remove('hidden');
    if(pauseResumeTimerButton) pauseResumeTimerButton.classList.remove('hidden');
    if(skipStageButton) skipStageButton.classList.add('hidden');
    startRecognitionConditionally();
    graceTimerInterval = setInterval(runActiveTimerInterval, 1000);
}

async function startMainSpeechTimer(duration) {
    await requestScreenWakeLock();
    stopRecognitionForce();
    if (currentTimerType !== 'grace' && currentTimerType !== 'choice_speech_pending') {
        clearAllTimersAndIntervals();
        await requestScreenWakeLock();
    }
    currentTimerType = 'main';
    timeLeft = duration;
    initialTimerDuration = duration;
    const timerLabelText = interpolateScript(currentFlowDefinition[currentStageIndex]?.timerLabel || currentFlowDefinition[currentStageIndex]?.baseTimerLabel || "計時");
    if(timerStatusDisplay) timerStatusDisplay.textContent = `${timerLabelText} 進行中...`;
    updateTimerDisplayDOM(timeLeft);
    if(timerDisplay) timerDisplay.classList.remove('hidden', 'warning1min', 'warning30sec', 'timesup');
    if(timerProgressBarContainer) timerProgressBarContainer.classList.remove('hidden');
    updateProgressBar(timeLeft, initialTimerDuration);
    if(nextStageButton) nextStageButton.disabled = true;
    if(pauseResumeTimerButton) pauseResumeTimerButton.classList.remove('hidden');
    if(skipStageButton) skipStageButton.classList.add('hidden');
    if(forceStartMainTimerButton) forceStartMainTimerButton.classList.add('hidden');
    if (timerInterval) clearInterval(timerInterval);
    if (graceTimerInterval) {
        clearInterval(graceTimerInterval);
        graceTimerInterval = null;
    }
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
    const timerLabelText = interpolateScript(currentFlowDefinition[currentStageIndex]?.timerLabel || "計時");
    if(timerStatusDisplay) timerStatusDisplay.textContent = `${timerLabelText} 進行中...`;
    updateTimerDisplayDOM(timeLeft);
    if(timerDisplay) timerDisplay.classList.remove('hidden', 'warning1min', 'warning30sec', 'timesup');
    if(timerProgressBarContainer) timerProgressBarContainer.classList.remove('hidden');
    updateProgressBar(timeLeft, initialTimerDuration);
    if(nextStageButton) nextStageButton.disabled = true;
    if(manualStartTimerButton) manualStartTimerButton.disabled = true;
    if(pauseResumeTimerButton) pauseResumeTimerButton.classList.remove('hidden');
    if(skipStageButton) skipStageButton.classList.add('hidden');
    timerInterval = setInterval(runActiveTimerInterval, 1000);
}

// --- Sidebar Editor Functions (Refactored) ---
function openEditSidebar(index, insertBefore = false) {
    editingStageIndex = index;
    const isNew = index === -1;
    let stageData = isNew ? { type: 'announcement', name: '', duration: 180 } : { ...currentFlowDefinition[index] };
    if(sidebarTitle) sidebarTitle.textContent = isNew ? "新增階段" : `編輯階段 ${index + 1}`;
    populateSidebarForm(stageData);
    if(stageEditSidebar) stageEditSidebar.classList.add('active');
}

function closeEditSidebar() {
    if(stageEditSidebar) stageEditSidebar.classList.remove('active');
}

function populateSidebarForm(stage) {
    const {
        name = '', type = 'announcement', duration = '', timerLabel = '', script = '',
        graceDuration = '', graceEndAction = 'auto_start', choosingTeam = 'positive',
        actionChoices = [], baseScript = '', baseTimerLabel = ''
    } = stage;
    if(!sidebarContent) return;
    sidebarContent.innerHTML = `
        <div class="input-group enhanced">
            <label class="input-label">階段名稱</label>
            <input type="text" id="sidebarStageName" class="form-input" value="${name}">
        </div>
        <div class="input-group enhanced">
            <label class="input-label">階段類型</label>
            <select id="sidebarStageType" class="form-select">
                <option value="announcement" ${type === 'announcement' ? 'selected' : ''}>📢 公告/提示</option>
                <option value="draw_rebuttal_order" ${type === 'draw_rebuttal_order' ? 'selected' : ''}>🎲 結辯順序抽籤</option>
                <option value="manual_prep" ${type === 'manual_prep' ? 'selected' : ''}>⏱️ 手動準備計時</option>
                <option value="speech_auto" ${type === 'speech_auto' ? 'selected' : ''}>🎤 自動發言計時</option>
                <option value="choice_speech" ${type === 'choice_speech' ? 'selected' : ''}>🗣️ 選擇性發言</option>
            </select>
        </div>
        <div id="sidebarDynamicFields"></div>
    `;
    const dynamicFieldsContainer = sidebarContent.querySelector('#sidebarDynamicFields');
    sidebarContent.querySelector('#sidebarStageType').addEventListener('change', (e) => handleSidebarFieldVisibility(e.target.value, dynamicFieldsContainer));
    handleSidebarFieldVisibility(type, dynamicFieldsContainer);
    // Populate fields after visibility is set
    if (document.getElementById('sidebarStageDuration')) document.getElementById('sidebarStageDuration').value = duration;
    if (document.getElementById('sidebarStageTimerLabel')) document.getElementById('sidebarStageTimerLabel').value = timerLabel;
    if (document.getElementById('sidebarStageScript')) document.getElementById('sidebarStageScript').value = script;
    if (document.getElementById('sidebarGraceDuration')) document.getElementById('sidebarGraceDuration').value = graceDuration;
    if (document.getElementById('sidebarGraceEndAction')) document.getElementById('sidebarGraceEndAction').value = graceEndAction;
    if (document.getElementById('sidebarChoosingTeam')) document.getElementById('sidebarChoosingTeam').value = choosingTeam;
    if (document.getElementById('sidebarActionChoices')) document.getElementById('sidebarActionChoices').value = Array.isArray(actionChoices) ? actionChoices.join(',') : '';
    if (document.getElementById('sidebarBaseScript')) document.getElementById('sidebarBaseScript').value = baseScript;
    if (document.getElementById('sidebarBaseTimerLabel')) document.getElementById('sidebarBaseTimerLabel').value = baseTimerLabel;
}

function handleSidebarFieldVisibility(type, container) {
    let fieldsHTML = '';
    if (['manual_prep', 'speech_auto', 'choice_speech'].includes(type)) {
        fieldsHTML += `<div class="input-group enhanced"><label class="input-label">主要時長 (秒)</label><input type="number" id="sidebarStageDuration" class="form-input" placeholder="e.g., 180"></div>`;
    }
    if (['manual_prep', 'speech_auto'].includes(type)) {
         fieldsHTML += `<div class="input-group enhanced"><label class="input-label">計時器標籤</label><input type="text" id="sidebarStageTimerLabel" class="form-input" placeholder="例如：申論時間"></div>`;
    }
    if (type === 'speech_auto') {
        fieldsHTML += `<div class="input-group enhanced"><label class="input-label">語音緩衝期 (秒)</label><input type="number" id="sidebarGraceDuration" class="form-input" placeholder="預設 60"></div>
            <div class="input-group enhanced"><label class="input-label">緩衝期結束後動作</label><select id="sidebarGraceEndAction" class="form-select"><option value="auto_start">自動開始主要計時</option><option value="manual_start">提示並等待手動開始</option><option value="auto_skip">自動跳過此階段</option></select></div>`;
    }
    if (type === 'choice_speech') {
        fieldsHTML += `<div class="input-group enhanced"><label class="input-label">選擇方</label><select id="sidebarChoosingTeam" class="form-select"><option value="positive">正方</option><option value="negative">反方</option></select></div>
            <div class="input-group enhanced"><label class="input-label">可選動作 (逗號分隔)</label><input type="text" id="sidebarActionChoices" class="form-input" placeholder="例如：申論,質詢"></div>
            <div class="input-group enhanced"><label class="input-label">基礎講稿</label><textarea id="sidebarBaseScript" class="form-input" rows="3"></textarea></div>
            <div class="input-group enhanced"><label class="input-label">基礎計時器標籤</label><input type="text" id="sidebarBaseTimerLabel" class="form-input"></div>`;
    }
    if (!['choice_speech'].includes(type)) {
         fieldsHTML += `<div class="input-group enhanced"><label class="input-label">主持人講稿</label><textarea id="sidebarStageScript" class="form-input" rows="4"></textarea></div>`;
    }
    container.innerHTML = fieldsHTML;
}

function saveSidebarChanges() {
    const stageNameVal = document.getElementById('sidebarStageName').value.trim();
    if (!stageNameVal) {
        alert("階段名稱不得為空");
        return;
    }
    let stageData = { name: stageNameVal, type: document.getElementById('sidebarStageType').value };
    if (document.getElementById('sidebarStageDuration')) stageData.duration = parseInt(document.getElementById('sidebarStageDuration').value) || null;
    if (document.getElementById('sidebarStageTimerLabel')) stageData.timerLabel = document.getElementById('sidebarStageTimerLabel').value.trim() || null;
    if (document.getElementById('sidebarStageScript')) stageData.script = document.getElementById('sidebarStageScript').value.trim() || null;
    if (document.getElementById('sidebarGraceDuration')) stageData.graceDuration = parseInt(document.getElementById('sidebarGraceDuration').value);
    if (document.getElementById('sidebarGraceEndAction')) stageData.graceEndAction = document.getElementById('sidebarGraceEndAction').value || 'auto_start';
    if (document.getElementById('sidebarChoosingTeam')) stageData.choosingTeam = document.getElementById('sidebarChoosingTeam').value || 'positive';
    if (document.getElementById('sidebarActionChoices')) stageData.actionChoices = document.getElementById('sidebarActionChoices').value.split(',').map(s => s.trim()).filter(Boolean);
    if (document.getElementById('sidebarBaseScript')) stageData.baseScript = document.getElementById('sidebarBaseScript').value.trim() || null;
    if (document.getElementById('sidebarBaseTimerLabel')) stageData.baseTimerLabel = document.getElementById('sidebarBaseTimerLabel').value.trim() || null;

    if (editingStageIndex === -1) {
        currentFlowDefinition.push(stageData);
    } else {
        currentFlowDefinition[editingStageIndex] = stageData;
    }
    renderEditorList();
    closeEditSidebar();
}

let sortableInstance = null;

function renderEditorList() {
    if(!flowEditorList) return;
    flowEditorList.innerHTML = '';
    if (currentFlowDefinition.length === 0) {
        const li = document.createElement('li');
        li.className = 'flow-editor-empty-prompt';
        li.innerHTML = `<span>🤔</span><strong>流程是空的！</strong><p>點擊下方的 <span class="text-gradient">新增階段</span> 按鈕來建立你的第一個流程。</p>`;
        li.onclick = () => openEditSidebar(-1);
        flowEditorList.appendChild(li);
        if (sortableInstance) sortableInstance.option("disabled", true);
        return;
    }
    if (sortableInstance) sortableInstance.option("disabled", false);
    currentFlowDefinition.forEach((stage, index) => {
        const li = document.createElement('li');
        li.className = 'stage-card';
        li.dataset.index = index;
        let detailsText = `類型: ${stage.type}`;
        if(stage.duration) detailsText += `, ${stage.duration}s`;
        li.innerHTML = `<div class="stage-info"><span class="stage-icon">${stageIcons[stage.type] || '⚙️'}</span><div class="stage-text"><strong>${index + 1}. ${stage.name || "未命名階段"}</strong><span>${detailsText}</span></div></div>
            <div class="editor-controls"><button class="btn btn-sm btn-outline edit-stage-btn">編輯</button><button class="btn btn-sm btn-danger delete-stage-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div>`;
        li.querySelector('.edit-stage-btn').onclick = (e) => { e.stopPropagation(); openEditSidebar(index); };
        li.querySelector('.delete-stage-btn').onclick = (e) => { e.stopPropagation(); deleteStage(index); };
        flowEditorList.appendChild(li);
    });
    if (!sortableInstance) {
        sortableInstance = new Sortable(flowEditorList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            handle: '.stage-card',
            onEnd: (evt) => {
                const [movedItem] = currentFlowDefinition.splice(evt.oldIndex, 1);
                currentFlowDefinition.splice(evt.newIndex, 0, movedItem);
                renderEditorList();
            },
        });
    }
}

function deleteStage(index) {
    if (confirm(`確定要刪除階段 ${index + 1} (${currentFlowDefinition[index].name}) 嗎？`)) {
        currentFlowDefinition.splice(index, 1);
        renderEditorList();
    }
}

function openStageChoiceModal(stage) {
    isStageChoiceModalOpen = true;
    if(stageChoiceModalTitle) stageChoiceModalTitle.textContent = `${interpolateScript(stage.name)} - 選擇類型與選手`;
    if(stageActionTypeSelect) {
        stageActionTypeSelect.innerHTML = '';
        if (Array.isArray(stage.actionChoices)) {
            stage.actionChoices.forEach(action => {
                const option = document.createElement('option');
                option.value = action;
                option.textContent = action;
                stageActionTypeSelect.appendChild(option);
            });
        }
    }
    if(stagePlayerSelect) {
        stagePlayerSelect.innerHTML = '';
        const players = stage.choosingTeam === 'positive' ? positiveTeamPlayers : negativeTeamPlayers;
        players.forEach((player) => {
            const option = document.createElement('option');
            option.value = player;
            option.textContent = player;
            stagePlayerSelect.appendChild(option);
        });
    }
    if(stageChoiceModal) stageChoiceModal.classList.add('active');
}

function closeStageChoiceModal() {
    isStageChoiceModalOpen = false;
    if(stageChoiceModal) stageChoiceModal.classList.remove('active');
}

function loadStage(index) {
    const stage = currentFlowDefinition[index];
    if (!stage) return;
    currentStageIndex = index;
    const stageNameForDisplay = interpolateScript(stage.name);
    if(currentStageInfoDisplay) currentStageInfoDisplay.textContent = `${stageIcons[stage.type] || ''} 目前階段：${stageNameForDisplay}`;
    if(moderatorScriptDisplay) moderatorScriptDisplay.textContent = interpolateScript(stage.script || stage.baseScript || "準備中...");
    clearAllTimersAndIntervals();
    if(manualStartTimerButton) manualStartTimerButton.classList.add('hidden');
    if(speechRecognitionStatusDisplay) speechRecognitionStatusDisplay.classList.add('hidden');
    if(drawRebuttalOrderSection) drawRebuttalOrderSection.classList.add('hidden');
    if(timerDisplay) timerDisplay.classList.add('hidden', 'warning1min', 'warning30sec', 'timesup');
    if(timerProgressBarContainer) timerProgressBarContainer.classList.add('hidden');
    if(timerStatusDisplay) timerStatusDisplay.textContent = "";

    if (currentStageIndex + 1 < currentFlowDefinition.length) {
        if(nextSegmentPreview) {
            nextSegmentPreview.textContent = `下一階段: ${interpolateScript(currentFlowDefinition[currentStageIndex + 1].name)}`;
            nextSegmentPreview.classList.remove('hidden');
        }
    } else {
        if(nextSegmentPreview) nextSegmentPreview.textContent = "最後環節";
    }

    const startNext = () => {
        if (isAutoModeEnabled && currentStageIndex < currentFlowDefinition.length -1) {
            setTimeout(() => { if (currentStageIndex === index) loadNextStage(); }, 2000);
        } else {
            if(nextStageButton) nextStageButton.disabled = false;
        }
    };

    switch (stage.type) {
        case "choice_speech":
            if(timerDisplay) timerDisplay.classList.add('hidden');
            if(timerProgressBarContainer) timerProgressBarContainer.classList.add('hidden');
            if(timerStatusDisplay) timerStatusDisplay.textContent = "請選擇發言者與類型";
            if(nextStageButton) nextStageButton.disabled = true;
            if(pauseResumeTimerButton) pauseResumeTimerButton.classList.add('hidden');
            speak(interpolateScript(stage.baseScript.split('。')[0]), () => openStageChoiceModal(stage));
            break;
        case "speech_auto":
            if(nextStageButton) nextStageButton.disabled = true;
            speak(interpolateScript(stage.script), () => startGracePeriodTimer());
            break;
        case "manual_prep":
            if(nextStageButton) nextStageButton.disabled = true;
            speak(interpolateScript(stage.script), () => {
                if(manualStartTimerButton) {
                    manualStartTimerButton.classList.remove('hidden');
                    manualStartTimerButton.disabled = false;
                    manualStartTimerButton.querySelector('span:last-child').textContent = `開始 ${interpolateScript(stage.timerLabel)}`;
                }
                if(timerDisplay) timerDisplay.classList.remove('hidden');
                if(timerProgressBarContainer) timerProgressBarContainer.classList.remove('hidden');
                initialTimerDuration = stage.duration;
                updateProgressBar(stage.duration, stage.duration);
                updateTimerDisplayDOM(stage.duration);
            });
            break;
        case "draw_rebuttal_order":
            releaseScreenWakeLock();
            if(drawRebuttalOrderSection) drawRebuttalOrderSection.classList.remove('hidden');
            if(drawResultDisplay) drawResultDisplay.textContent = "待抽籤...";
            if(startDrawButton) startDrawButton.disabled = false;
            if(nextStageButton) nextStageButton.disabled = true;
            speak(interpolateScript(stage.script));
            break;
        default: // announcement
            releaseScreenWakeLock();
            if(nextStageButton) nextStageButton.disabled = true;
            speak(interpolateScript(stage.script), startNext);
            break;
    }
}

function loadNextStage() {
    stopRecognitionForce();
    if (currentStageIndex + 1 < currentFlowDefinition.length) {
        playSound('stageAdvanceSound');
        loadStage(currentStageIndex + 1);
    } else {
        if(currentStageInfoDisplay) currentStageInfoDisplay.textContent = "所有流程已結束。";
        if(moderatorScriptDisplay) moderatorScriptDisplay.textContent = "";
        if(nextStageButton) nextStageButton.disabled = true;
        clearAllTimersAndIntervals();
        if(nextSegmentPreview) nextSegmentPreview.textContent = "辯論已結束";
        speak("所有流程已結束。");
    }
}

function applyTheme(theme) {
    if (theme === 'dark') {
        bodyElement.setAttribute('data-theme', 'dark');
    } else {
        bodyElement.removeAttribute('data-theme');
    }
    syncMenuStates();
}

function toggleTheme() {
    const newTheme = bodyElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('debateTimerTheme', newTheme);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.error("FS Err:", err));
    } else {
        document.exitFullscreen().catch(err => console.error("FS Err:", err));
    }
}

function handleFullscreenChange() {
    const isFullscreen = !!document.fullscreenElement;
    if (isFullscreen) {
        if(fullscreenRealTimeClock) fullscreenRealTimeClock.classList.remove('hidden');
        if (!realTimeClockInterval) realTimeClockInterval = setInterval(() => {
            if(fullscreenRealTimeClock) fullscreenRealTimeClock.textContent = new Date().toLocaleTimeString()
        }, 1000);
    } else {
        if(fullscreenRealTimeClock) fullscreenRealTimeClock.classList.add('hidden');
        if (realTimeClockInterval) clearInterval(realTimeClockInterval);
        realTimeClockInterval = null;
    }
}

function showShortcutHelpModal() {
    if(shortcutHelpModal) shortcutHelpModal.classList.add('active');
}

function closeShortcutHelpModal() {
    if(shortcutHelpModal) shortcutHelpModal.classList.remove('active');
}

function populateFormatSelector() {
    if(!formatSelect) return;
    const selectedValue = formatSelect.value;
    formatSelect.innerHTML = '';
    for (const formatName in debateFormatDefinitions) {
        const option = document.createElement('option');
        option.value = formatName;
        option.textContent = formatName;
        formatSelect.appendChild(option);
    }
    const customOption = document.createElement('option');
    customOption.value = "CUSTOM_EMPTY";
    customOption.textContent = "自訂流程 (空白)";
    formatSelect.appendChild(customOption);
    if (selectedValue) formatSelect.value = selectedValue;
}

// Hamburger Menu Functions
function openHamburgerMenu() {
    if(hamburgerMenu) hamburgerMenu.classList.add('active');
    if(hamburgerButton) hamburgerButton.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeHamburgerMenu() {
    if(hamburgerMenu) hamburgerMenu.classList.remove('active');
    if(hamburgerButton) hamburgerButton.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleHamburgerMenu() {
    if (hamburgerMenu?.classList.contains('active')) {
        closeHamburgerMenu();
    } else {
        openHamburgerMenu();
    }
}

function syncMenuStates() {
    if (themeStatusBadge) {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        themeStatusBadge.textContent = isDark ? '深色' : '明亮';
    }
    if (menuAutoModeInput && autoModeToggle) {
        menuAutoModeInput.checked = autoModeToggle.checked;
    }
}

function showUpgradeModal() {
    alert('升級到 Pro Max 版本！\n\n✨ 無限制辯論場次\n🎯 AI 智能計時建議\n📊 詳細數據分析\n🔄 雲端同步備份');
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    
    populateFormatSelector();

    const savedTheme = localStorage.getItem('debateTimerTheme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    const savedAutoMode = localStorage.getItem('debateAutoMode') === 'true';
    isAutoModeEnabled = savedAutoMode;
    if(autoModeToggle) autoModeToggle.checked = savedAutoMode;

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    
    // Setup Phase
    if(confirmSetupButton) confirmSetupButton.addEventListener('click', () => {
        const selectedFormatName = formatSelect.value;
        currentFlowDefinition = JSON.parse(JSON.stringify(debateFormatDefinitions[selectedFormatName] || []));
        if (currentFlowDefinition.length === 0) {
            alert("自訂流程是空的，請先編輯流程。");
            return;
        }
        
        positiveTeamName = positiveTeamNameInput.value.trim() || "正方";
        negativeTeamName = negativeTeamNameInput.value.trim() || "反方";
        debateTopic = debateTopicInput.value.trim() || "（未設定辯題）";
        
        positiveTeamPlayers = Array.from(document.querySelectorAll('.player-input[data-team="positive"]')).map(i => i.value.trim() || i.placeholder);
        negativeTeamPlayers = Array.from(document.querySelectorAll('.player-input[data-team="negative"]')).map(i => i.value.trim() || i.placeholder);

        const posPlayersList = positiveTeamPlayers.join(', ');
        const negPlayersList = negativeTeamPlayers.join(', ');

        if(debateInfoDisplay) debateInfoDisplay.innerHTML = `<p><strong>流程：</strong>${selectedFormatName}</p><p><strong>辯題：</strong>${debateTopic}</p><p><strong>${positiveTeamName} (${posPlayersList})</strong> vs <strong>${negativeTeamName} (${negPlayersList})</strong></p>`;

        if(setupPhaseDiv) setupPhaseDiv.classList.add('hidden');
        if(debatePhaseDiv) debatePhaseDiv.classList.remove('hidden');
        if(nextStageButton) nextStageButton.classList.remove('hidden');
        if(resetButton) resetButton.classList.remove('hidden');
        loadStage(-1);
        loadNextStage();
    });

    if(editFlowButton) editFlowButton.addEventListener('click', () => {
        const selectedFormatName = formatSelect.value;
        if (selectedFormatName === "CUSTOM_EMPTY") {
            currentFlowDefinition = [];
        } else {
            currentFlowDefinition = JSON.parse(JSON.stringify(debateFormatDefinitions[selectedFormatName] || []));
        }
        originalFlowBeforeEdit = JSON.parse(JSON.stringify(currentFlowDefinition));
        if(setupPhaseDiv) setupPhaseDiv.classList.add('hidden');
        if(flowEditorSection) flowEditorSection.classList.remove('hidden');
        renderEditorList();
    });

    // Editor
    if(cancelEditingButton) cancelEditingButton.addEventListener('click', () => {
        if (confirm("取消編輯？所有未儲存的變更將會遺失。")) {
            if(flowEditorSection) flowEditorSection.classList.add('hidden');
            if(setupPhaseDiv) setupPhaseDiv.classList.remove('hidden');
            currentFlowDefinition = originalFlowBeforeEdit || [];
            originalFlowBeforeEdit = null;
        }
    });
    if(finishEditingButton) finishEditingButton.addEventListener('click', () => {
        let baseName = formatSelect.value;
         if (baseName === "CUSTOM_EMPTY") { 
            baseName = prompt("請為您的新流程命名：", "我的自訂流程") || "未命名流程";
            if (!baseName) return;
        }
        const editedFlowName = `${baseName} (自訂)`;
        debateFormatDefinitions[editedFlowName] = JSON.parse(JSON.stringify(currentFlowDefinition));
        populateFormatSelector();
        formatSelect.value = editedFlowName;
        if(flowEditorSection) flowEditorSection.classList.add('hidden');
        if(setupPhaseDiv) setupPhaseDiv.classList.remove('hidden');
        alert(`流程 "${editedFlowName}" 已儲存並選取。`);
    });
    if(saveSidebarBtn) saveSidebarBtn.addEventListener('click', saveSidebarChanges);
    if(cancelSidebarBtn) cancelSidebarBtn.addEventListener('click', closeEditSidebar);
    if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeEditSidebar);

    // Debate Phase
    if(startDrawButton) startDrawButton.addEventListener('click', () => {
        playSound('drawSound');
        rebuttalOrder = Math.random() < 0.5 ? 'positive_first' : 'negative_first';
        const drawnTeamName = rebuttalOrder === 'positive_first' ? positiveTeamName : negativeTeamName;
        if(drawResultDisplay) drawResultDisplay.textContent = `抽籤結果：${drawnTeamName} 先結辯。`;
        startDrawButton.disabled = true;
        if (isAutoModeEnabled) {
            setTimeout(() => loadNextStage(), 2000);
        } else {
            if(nextStageButton) nextStageButton.disabled = false;
        }
    });
    if(nextStageButton) nextStageButton.addEventListener('click', () => {
        if (synth.speaking) synth.cancel();
        isManualAdvance = true;
        loadNextStage();
    });
    if(manualStartTimerButton) manualStartTimerButton.addEventListener('click', () => {
        const stage = currentFlowDefinition[currentStageIndex];
        if (stage && stage.type === "manual_prep") startManualPrepTimer(stage.duration);
    });
    if(forceStartMainTimerButton) forceStartMainTimerButton.addEventListener('click', () => {
        const currentStage = currentFlowDefinition[currentStageIndex];
        if (currentStage && currentTimerType === 'grace') {
            if (graceTimerInterval) clearInterval(graceTimerInterval);
            stopRecognitionForce();
            startMainSpeechTimer(currentStage.duration);
        }
    });
    if(pauseResumeTimerButton) pauseResumeTimerButton.addEventListener('click', () => {
        isTimerPaused = !isTimerPaused;
        const span = pauseResumeTimerButton.querySelector('span');
        if(span) span.textContent = isTimerPaused ? "恢復" : "暫停";
        if (isTimerPaused) {
            if(currentTimerType === 'grace') clearInterval(graceTimerInterval);
            else clearInterval(timerInterval);
            stopRecognitionForce();
            if(skipStageButton) skipStageButton.classList.remove('hidden');
        } else {
            requestScreenWakeLock();
            if (currentTimerType === 'grace') {
                startRecognitionConditionally();
                graceTimerInterval = setInterval(runActiveTimerInterval, 1000);
            } else {
                timerInterval = setInterval(runActiveTimerInterval, 1000);
            }
            if(skipStageButton) skipStageButton.classList.add('hidden');
        }
    });
    if(skipStageButton) skipStageButton.addEventListener('click', () => {
        if (isTimerPaused) {
            clearAllTimersAndIntervals();
            loadNextStage();
        }
    });
    if(resetButton) resetButton.addEventListener('click', () => {
        if (confirm("確定要重設嗎？所有進度將會遺失。")) {
            window.location.reload();
        }
    });
    if(autoModeToggle) autoModeToggle.addEventListener('change', (event) => {
        isAutoModeEnabled = event.target.checked;
        localStorage.setItem('debateAutoMode', isAutoModeEnabled);
    });
    if(confirmStageChoiceButton) confirmStageChoiceButton.addEventListener('click', () => {
        currentStageSelectedPlayer = stagePlayerSelect.value;
        currentStageSelectedActionType = stageActionTypeSelect.value;
        closeStageChoiceModal();
        const stage = currentFlowDefinition[currentStageIndex];
        const finalModeratorScript = interpolateScript(stage.baseScript);
        const finalTimerLabel = interpolateScript(stage.baseTimerLabel);
        if(currentStageInfoDisplay) currentStageInfoDisplay.textContent = `${stageIcons[stage.type] || '🗣️'} ${interpolateScript(stage.name)}`;
        if(moderatorScriptDisplay) moderatorScriptDisplay.textContent = finalModeratorScript;
        if(timerStatusDisplay) timerStatusDisplay.textContent = `準備 ${finalTimerLabel}`;
        speak(finalModeratorScript, () => {
            timeLeft = stage.duration;
            initialTimerDuration = stage.duration;
            updateTimerDisplayDOM(timeLeft);
            if(timerDisplay) timerDisplay.classList.remove('hidden');
            if(timerProgressBarContainer) timerProgressBarContainer.classList.remove('hidden');
            updateProgressBar(timeLeft, initialTimerDuration);
            currentTimerType = 'choice_speech_pending';
            startMainSpeechTimer(stage.duration);
        });
    });

    // Hamburger Menu and general UI
    if(hamburgerButton) hamburgerButton.addEventListener('click', toggleHamburgerMenu);
    if(closeMenuButton) closeMenuButton.addEventListener('click', closeHamburgerMenu);
    if(menuOverlay) menuOverlay.addEventListener('click', closeHamburgerMenu);
    if(menuThemeToggle) menuThemeToggle.addEventListener('click', () => {
        toggleTheme();
    });
    if(menuAutoModeInput) menuAutoModeInput.addEventListener('change', (e) => {
        if(autoModeToggle) {
            autoModeToggle.checked = e.target.checked;
            autoModeToggle.dispatchEvent(new Event('change'));
        }
    });
    if(menuFullscreen) menuFullscreen.addEventListener('click', () => {
        toggleFullscreen();
        closeHamburgerMenu();
    });
    if(menuHelp) menuHelp.addEventListener('click', () => {
        showShortcutHelpModal();
        closeHamburgerMenu();
    });
    if(upgradeButton) upgradeButton.addEventListener('click', showUpgradeModal);
    if(upgradeButtonMobile) upgradeButtonMobile.addEventListener('click', showUpgradeModal);
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Modals
    if(shortcutHelpFooterButton) shortcutHelpFooterButton.addEventListener('click', showShortcutHelpModal);
    if(shortcutHelpModal) {
        shortcutHelpModal.querySelector('.modal-backdrop')?.addEventListener('click', closeShortcutHelpModal);
        shortcutHelpModal.querySelector('.modal-close')?.addEventListener('click', closeShortcutHelpModal);
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
        if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

        switch(e.key.toUpperCase()) {
            case 'N': nextStageButton?.click(); break;
            case 'P': pauseResumeTimerButton?.click(); break;
            case 'S': skipStageButton?.click(); break;
            case 'R': resetButton?.click(); break;
            case 'F': toggleFullscreen(); break;
            case 'T': toggleTheme(); break;
            case 'A': if(autoModeToggle) autoModeToggle.click(); break;
            case 'ESCAPE':
                 if (hamburgerMenu?.classList.contains('active')) closeHamburgerMenu();
                 else if (shortcutHelpModal?.classList.contains('active')) closeShortcutHelpModal();
                 else if (stageChoiceModal?.classList.contains('active')) closeStageChoiceModal();
                 else if (stageEditSidebar?.classList.contains('active')) closeEditSidebar();
                 break;
        }
    });

    syncMenuStates();
});