const App = {
    state: {
        currentView: 'setup', // 'setup', 'nineSquare', 'editor', 'debate'
        setupStep: 1, // 賽前設定步驟：1=辯題與賽制, 2=隊伍資訊, 3=進階設定
        selectedFormat: '', // 選擇的賽制名稱
        tournamentName: '', // 盃賽名稱
        wakeLock: null,
        positiveTeamName: "正方",
        negativeTeamName: "反方",
        debateTopic: "（在此輸入辯題）",
        positiveTeamPlayers: ["正一", "正二", "正三"],
        negativeTeamPlayers: ["反一", "反二", "反三"],
        positiveClosingIndex: 2, // 正方結辯索引（預設正三）
        negativeClosingIndex: 2, // 反方結辯索引（預設反三）
        judges: ["裁判一", "裁判二", "裁判三"],
        positiveNineSquare: {},
        negativeNineSquare: {},
        formatFilterTag: '全部', // 賽制標籤篩選
        currentFlow: [],
        originalFlowBeforeEdit: null,
        currentStageIndex: -1,
        rebuttalOrder: null,
        isAutoMode: true,
        enableSpeechDetection: true,
        enableSpeech: true,
        mainSpeechTimerStartedByGrace: false,
        recognitionManuallyStopped: false,
        isRecognizing: false,
        timer: {
            interval: null,
            graceInterval: null,
            timeLeft: 0,
            initialDuration: 0,
            isPaused: false,
            type: null, // 'grace', 'main', 'manual_prep'
        },
        transcription: {
            active: false,
            paused: false,
            paragraphs: [],
            currentParagraphId: null,
            interimContent: '',
            MAX_PARAGRAPHS: 50, // [記憶體優化] 最多保留 50 段落
        },
        pip: { // New state for Picture-in-Picture
            isActive: false,
            videoElement: null,
        },
        speechRecognitionStatus: 'unavailable', // 'unavailable', 'ready', 'active', 'error'
        sortableInstance: null,
        isAdvancingStage: false,
        autoAdvanceTimeout: null,
        speechQueue: [],
        isSpeaking: false,
        isRinging: false,
        isAudioUnlocked: false,
        currentChoice: {
            stage: null,
            resolve: null,
        },
        currentJudgeChoice: {
            stage: null,
            resolve: null,
            reject: null,
        },
        judgeCommentOrder: [], // 裁判講評順序
        currentJudge: null, // 當前講評的裁判
        positiveActionCounts: { '申論': 0, '質答': 0 },
        negativeActionCounts: { '申論': 0, '質答': 0 },
        customGraceDuration: 60, // 預設準備時間為 60 秒
        audioSourceModes: { positive: 'microphone', negative: 'microphone' },
        audioDetection: {
            vad: null, // 用來存放 VAD 實體
            stream: null,
            isActive: false,
        },
        vadSuppressed: false,         // TTS 朗讀時抑制 VAD，避免系統聲音誤觸發
        vadSuppressionTimeout: null,  // TTS 結束後的抑制延遲計時器
        speechDetectionLockController: null, // Web Locks API 的 AbortController，用於多分頁衝突防護
        history: [], // 用來存放狀態歷史紀錄
        MAX_HISTORY_STATES: 20,
        isPresentationMode: false, // 是否為簡報模式
        // [ADD THIS START]
        recording: {
            mediaRecorder: null,
            mediaStream: null,
            isRecording: false,
            isPaused: false,          // 錄音是否暫停
            pausedDuration: 0,        // 暫停期間累計的時間（毫秒）
            pauseStartTime: null,     // 暫停開始時間
            isAvailable: false,
            recordedChunks: [],
            intermediateBlobs: [], // [記憶體優化] 定期合併的中間 Blobs
            audioBlob: null,
            micAudioTrack: null, // 用來儲存音訊軌道
            isMicMuted: false,   // 追蹤目前的靜音狀態
            // 時間戳功能
            timestamps: [],           // 當前錄音時間戳陣列
            recordingStartTime: null, // 錄音開始的時間戳 (Date.now())
            isPlayerOpen: false,      // 播放器是否開啟
            // 多段錄音支援
            recordings: [],           // 所有錄音段落: [{audioBlob, timestamps, startTime}]
        },

        freeDebate: {
            stage: null,
            initialDuration: 180,
            positiveTimeLeft: 180,
            negativeTimeLeft: 180,
            activeTeam: null, // 'positive', 'negative', 或 null
            interval: null,
            isPaused: false,
            firstSpeakerSelected: false, // 是否已選擇第一位發言者
        },
        sharedDisplay: {
            stream: null,       // 用來儲存完整的 getDisplayMedia 串流
            audioTrack: null,   // 用來儲存從串流中取出的音訊軌道
            isInitialized: false // 用來標記是否已經授權過
        },

        // 教學引導狀態
        onboarding: {
            isActive: false,
            currentStep: 0,
            currentChapter: 0,
            mode: 'setup', // 'setup' 或 'debate' - 根據當前頁面決定教學內容
        },

        // 投影模式狀態
        projector: {
            channel: null,               // BroadcastChannel 實體
            displayWindow: null,         // 外部顯示視窗參照 (window.open)
            presentationConnection: null, // Presentation API 連接
            isActive: false,             // 投影模式是否啟用
            heartbeatInterval: null,     // 心跳計時器
            windowCheckInterval: null,   // 視窗關閉檢查計時器
            mode: null,                  // 'presentation-api' 或 'window'
        },
    },

    // --- 教學引導系統 (Onboarding Tour) ---
    // 根據不同模式（賽前設定 / 比賽中）定義不同的教學內容

    // 賽前設定模式的教學章節
    setupTourChapters: [
        {
            id: 'welcome',
            title: '歡迎使用辯時計',
            icon: '👋',
            steps: [
                {
                    target: null,
                    title: '歡迎使用辯時計！',
                    description: '這是一套專為臺灣辯論設計的計時系統。讓我們快速了解主要功能，幫助您快速上手。',
                    position: 'center',
                },
            ]
        },
        {
            id: 'basic-setup',
            title: '基本設定',
            icon: '⚙️',
            steps: [
                {
                    target: '#tournamentNameInput',
                    title: '盃賽名稱（選填）',
                    description: '輸入盃賽或比賽名稱，例如「大辯盃辯論比賽」。此資訊會顯示在投影畫面上。',
                },
                {
                    target: '#debateTopicInput',
                    title: '設定辯題',
                    description: '在這裡輸入本場比賽的辯論題目，例如「我國應廢除死刑」。這是必填欄位。',
                },
                {
                    target: '#formatDropdownContainer',
                    title: '選擇比賽賽制',
                    description: '點擊選單選擇預設的比賽流程。支援新式奧瑞岡、新加坡制等多種常見賽制，也可以建立自訂流程。',
                },
            ]
        },
        {
            id: 'features',
            title: '功能介紹',
            icon: '✨',
            steps: [
                {
                    target: '#hamburgerBtn',
                    title: '控制中心',
                    description: '點擊右上角選單按鈕可開啟控制中心，調整自動模式、語音朗讀、深淺主題等設定。',
                },
                {
                    target: '.sticky-action-bar',
                    title: '底部操作列',
                    description: '這裡可以編輯流程、匯入/分享設定。點擊「下一步」進入隊伍資訊設定。',
                    position: 'top',
                },
            ]
        },
        {
            id: 'more-info',
            title: '更多功能',
            icon: '📚',
            steps: [
                {
                    target: null,
                    title: '隊伍與辯士設定',
                    description: '點擊「下一步」後，可以設定正反方隊名、辯士姓名，並勾選結辯辯士。這些資訊會顯示在投影畫面上。',
                    position: 'center',
                },
                {
                    target: null,
                    title: '投影模式',
                    description: '開始比賽後，可在底部工具列啟用投影模式，開啟獨立的投影視窗，讓觀眾看到專業的計時畫面。',
                    position: 'center',
                },
            ]
        },
        {
            id: 'complete',
            title: '教學完成',
            icon: '🎉',
            steps: [
                {
                    target: '.btn-start-match',
                    title: '準備開始！',
                    description: '設定好辯題和賽制後，點擊「下一步」繼續設定隊伍，或使用預設值直接開始比賽。隨時可點擊右上角「？」重新查看教學。',
                },
            ]
        },
    ],

    // 比賽模式的教學章節
    debateTourChapters: [
        {
            id: 'debate-welcome',
            title: '比賽控制教學',
            icon: '🎮',
            steps: [
                {
                    target: null,
                    title: '比賽控制教學',
                    description: '歡迎進入比賽模式！讓我們了解如何操控計時器和管理比賽流程。',
                    position: 'center',
                },
            ]
        },
        {
            id: 'timer-control',
            title: '計時器控制',
            icon: '⏱️',
            steps: [
                {
                    target: '.timer-display',
                    title: '計時器顯示',
                    description: '這裡顯示目前階段的剩餘時間。時間快到時會變色提醒，結束時會響鈴。',
                },
                {
                    target: '.main-dock-bar',
                    title: '主控制列',
                    description: '中央的播放/暫停按鈕控制計時器。左右箭頭可跳至上一階段或下一階段。',
                    position: 'top',
                },
            ]
        },
        {
            id: 'flow-control',
            title: '流程控制',
            icon: '📋',
            steps: [
                {
                    target: '.flow-tracker-strip',
                    title: '流程追蹤列',
                    description: '這裡顯示比賽流程。可左右滑動查看所有階段，點擊任一階段可快速跳轉。',
                },
                {
                    target: null,
                    title: '自動模式',
                    description: '開啟「自動模式」後，準備時間結束會自動開始計時，適合讓比賽更流暢進行。',
                    position: 'center',
                },
            ]
        },
        {
            id: 'extra-features',
            title: '進階功能',
            icon: '✨',
            steps: [
                {
                    target: '#dockPopupMenu',
                    title: '更多功能選單',
                    description: '點擊右側選單按鈕，可使用語音朗讀、畫中畫、投影模式、全螢幕等功能。',
                    position: 'top',
                },
                {
                    target: null,
                    title: '復原與重設',
                    description: '「復原」可還原上一步操作。「重設」會重新開始整場比賽。操作前請謹慎確認。',
                    position: 'center',
                },
            ]
        },
        {
            id: 'debate-complete',
            title: '教學完成',
            icon: '🎉',
            steps: [
                {
                    target: null,
                    title: '準備好了！',
                    description: '現在您已了解比賽控制的基本操作。祝您比賽順利！如需再次查看教學，請點擊右上角「？」按鈕。',
                    position: 'center',
                },
            ]
        },
    ],

    // 取得當前模式的教學章節
    get tourChapters() {
        return this.state.onboarding.mode === 'debate'
            ? this.debateTourChapters
            : this.setupTourChapters;
    },

    // 取得所有扁平化的步驟（向後相容）
    get tourSteps() {
        const steps = [];
        this.tourChapters.forEach((chapter, chapterIndex) => {
            chapter.steps.forEach((step, stepIndex) => {
                steps.push({
                    ...step,
                    chapterIndex,
                    chapterTitle: chapter.title,
                    chapterIcon: chapter.icon,
                });
            });
        });
        return steps;
    },

    initOnboarding() {
        // 檢查是否為首次訪問
        const hasSeenTour = localStorage.getItem('debateTourCompleted');
        if (!hasSeenTour && this.state.currentView === 'setup') {
            // 延遲啟動，確保頁面完全渲染
            setTimeout(() => this.startTour(), 500);
        }

        // 綁定事件監聽器
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            document.getElementById('tour-next').addEventListener('click', () => this.nextTourStep());
            document.getElementById('tour-prev').addEventListener('click', () => this.prevTourStep());
            document.getElementById('tour-skip').addEventListener('click', () => this.endTour());

            // 鍵盤導航支援
            this._tourKeyboardHandler = (e) => {
                if (!this.state.onboarding.isActive) return;
                if (e.key === 'ArrowRight' || e.key === 'Enter') {
                    e.preventDefault();
                    this.nextTourStep();
                } else if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    this.prevTourStep();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.endTour();
                }
            };
            document.addEventListener('keydown', this._tourKeyboardHandler);
        }
    },

    startTour(forceMode = null) {
        // 判斷教學模式
        const currentView = this.state.currentView;
        let mode = forceMode;

        if (!mode) {
            if (currentView === 'debate' || currentView === 'free_debate') {
                mode = 'debate';
            } else {
                mode = 'setup';
            }
        }

        this.state.onboarding.mode = mode;
        this.state.onboarding.isActive = true;
        this.state.onboarding.currentStep = 0;
        this.state.onboarding.currentChapter = 0;

        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.add('active');
        }

        this.updateTourStep();
    },

    endTour() {
        this.state.onboarding.isActive = false;

        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }

        // 移除滾動和調整大小監聽器
        if (this._tourScrollHandler) {
            window.removeEventListener('scroll', this._tourScrollHandler, true);
            this._tourScrollHandler = null;
        }
        if (this._tourResizeHandler) {
            window.removeEventListener('resize', this._tourResizeHandler);
            this._tourResizeHandler = null;
        }

        // 根據模式儲存已完成狀態
        const mode = this.state.onboarding.mode;
        if (mode === 'setup') {
            localStorage.setItem('debateTourCompleted', 'true');
        } else if (mode === 'debate') {
            localStorage.setItem('debateControlTourCompleted', 'true');
        }
    },

    nextTourStep() {
        if (this.state.onboarding.currentStep < this.tourSteps.length - 1) {
            this.state.onboarding.currentStep++;
            this.updateTourStep();
        } else {
            this.endTour();
            const msg = this.state.onboarding.mode === 'debate'
                ? '🎉 教學完成！祝您比賽順利！'
                : '🎉 教學完成！開始您的第一場辯論吧！';
            this.showNotification(msg, 'success');
        }
    },

    prevTourStep() {
        if (this.state.onboarding.currentStep > 0) {
            this.state.onboarding.currentStep--;
            this.updateTourStep();
        }
    },

    // 跳轉到指定章節
    goToChapter(chapterIndex) {
        // 找到該章節的第一個步驟
        let stepIndex = 0;
        for (let i = 0; i < chapterIndex; i++) {
            stepIndex += this.tourChapters[i].steps.length;
        }
        this.state.onboarding.currentStep = stepIndex;
        this.state.onboarding.currentChapter = chapterIndex;
        this.updateTourStep();
    },

    updateTourStep() {
        const step = this.tourSteps[this.state.onboarding.currentStep];
        const totalSteps = this.tourSteps.length;
        const currentIdx = this.state.onboarding.currentStep;

        // 取得 DOM 元素並檢查是否存在
        const stepBadge = document.getElementById('tour-step-badge');
        const titleEl = document.getElementById('tour-title');
        const descEl = document.getElementById('tour-description');
        const prevBtn = document.getElementById('tour-prev');
        const nextBtn = document.getElementById('tour-next');
        const progressContainer = document.getElementById('tour-progress');
        const chapterProgress = document.getElementById('tour-chapter-progress');
        const chapterIcon = document.getElementById('tour-chapter-icon');
        const chapterTitle = document.getElementById('tour-chapter-title');
        const tooltip = document.getElementById('onboarding-tooltip');

        // 確保所有必要元素都存在
        if (!stepBadge || !titleEl || !descEl || !prevBtn || !nextBtn || !progressContainer) {
            console.error('Onboarding tour: Missing DOM elements');
            return;
        }

        // 更新章節資訊
        if (chapterIcon) chapterIcon.textContent = step.chapterIcon || '📚';
        if (chapterTitle) chapterTitle.textContent = step.chapterTitle || '';

        // 更新內容
        stepBadge.textContent = `步驟 ${currentIdx + 1} / ${totalSteps}`;
        titleEl.textContent = step.title;
        descEl.textContent = step.description;

        // 更新按鈕狀態
        prevBtn.disabled = currentIdx === 0;
        prevBtn.style.display = currentIdx === 0 ? 'none' : 'flex';

        const isLastStep = currentIdx === totalSteps - 1;
        nextBtn.innerHTML = isLastStep
            ? '完成教學 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>'
            : '下一步 <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>';

        // 更新章節進度指示器
        if (chapterProgress) {
            chapterProgress.innerHTML = '';
            this.tourChapters.forEach((chapter, i) => {
                const dot = document.createElement('span');
                const isActive = i === step.chapterIndex;
                const isCompleted = i < step.chapterIndex;
                dot.className = `chapter-dot${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}`;
                dot.setAttribute('data-title', chapter.title);
                dot.addEventListener('click', () => this.goToChapter(i));
                chapterProgress.appendChild(dot);
            });
        }

        // 更新步驟進度指示器（只顯示當前章節的步驟）
        progressContainer.innerHTML = '';
        const chapterSteps = this.tourChapters[step.chapterIndex]?.steps || [];
        const stepInChapter = this.getStepIndexInChapter(currentIdx, step.chapterIndex);
        chapterSteps.forEach((_, i) => {
            const dot = document.createElement('span');
            dot.className = `progress-dot${i === stepInChapter ? ' active' : ''}`;
            progressContainer.appendChild(dot);
        });

        // 處理中央定位或目標元素定位
        if (tooltip) {
            if (step.position === 'center' || !step.target) {
                tooltip.classList.add('center-mode');
                this.positionTourElementsCenter();
            } else {
                tooltip.classList.remove('center-mode');
                this.positionTourElements(step.target, step.position);
            }
        }
    },

    // 取得步驟在章節內的索引
    getStepIndexInChapter(globalStepIndex, chapterIndex) {
        let stepsBefore = 0;
        for (let i = 0; i < chapterIndex; i++) {
            stepsBefore += this.tourChapters[i].steps.length;
        }
        return globalStepIndex - stepsBefore;
    },

    // 滾動動畫延遲常數 (毫秒)
    TOUR_SCROLL_DELAY: 300,

    // 中央定位模式
    positionTourElementsCenter() {
        const highlight = document.getElementById('onboarding-highlight');
        const tooltip = document.getElementById('onboarding-tooltip');

        if (!tooltip) return;

        // 隱藏高亮框
        if (highlight) {
            highlight.style.width = '0';
            highlight.style.height = '0';
            highlight.style.boxShadow = 'none';
        }

        // 將提示卡片置中
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const tooltipWidth = tooltip.offsetWidth || 400;
        const tooltipHeight = tooltip.offsetHeight || 250;

        tooltip.style.top = `${(viewportHeight - tooltipHeight) / 2}px`;
        tooltip.style.left = `${(viewportWidth - tooltipWidth) / 2}px`;
    },

    positionTourElements(targetSelector, preferredPosition) {
        const target = document.querySelector(targetSelector);
        const highlight = document.getElementById('onboarding-highlight');
        const tooltip = document.getElementById('onboarding-tooltip');

        if (!target || !highlight || !tooltip) {
            console.warn('Onboarding tour: Target element or tour elements not found', targetSelector);
            // 如果找不到目標，使用中央定位
            this.positionTourElementsCenter();
            return;
        }

        // 恢復高亮框樣式
        highlight.style.boxShadow = '0 0 0 4000px rgba(0, 0, 0, 0.6)';

        // 滾動目標元素進入視野
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 定義更新位置的函數
        const updatePositions = () => {
            const rect = target.getBoundingClientRect();
            const padding = 8;

            // 設定高亮框位置
            highlight.style.left = `${rect.left - padding}px`;
            highlight.style.top = `${rect.top - padding}px`;
            highlight.style.width = `${rect.width + padding * 2}px`;
            highlight.style.height = `${rect.height + padding * 2}px`;

            // 取得提示卡片的預估尺寸
            const tooltipWidth = tooltip.offsetWidth || 320;
            const tooltipHeight = tooltip.offsetHeight || 200;
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            let tooltipTop, tooltipLeft;

            // 根據偏好位置決定放置位置
            if (preferredPosition === 'top') {
                // 強制放在元素上方
                tooltipTop = rect.top - tooltipHeight - 16;
                if (tooltipTop < 20) {
                    tooltipTop = rect.bottom + 16;
                }
            } else {
                // 優先嘗試放在元素下方
                if (rect.bottom + tooltipHeight + 20 < viewportHeight) {
                    tooltipTop = rect.bottom + 16;
                } else if (rect.top - tooltipHeight - 20 > 0) {
                    // 放在元素上方
                    tooltipTop = rect.top - tooltipHeight - 16;
                } else {
                    // 放在視窗中央
                    tooltipTop = Math.max(20, (viewportHeight - tooltipHeight) / 2);
                }
            }

            // 水平置中對齊目標元素
            tooltipLeft = rect.left + (rect.width - tooltipWidth) / 2;

            // 確保不超出螢幕邊界
            tooltipLeft = Math.max(16, Math.min(tooltipLeft, viewportWidth - tooltipWidth - 16));

            tooltip.style.top = `${tooltipTop}px`;
            tooltip.style.left = `${tooltipLeft}px`;
        };

        // 延遲計算位置，等待滾動完成
        setTimeout(() => {
            updatePositions();

            // 移除舊的滾動監聽器
            if (this._tourScrollHandler) {
                window.removeEventListener('scroll', this._tourScrollHandler, true);
            }
            if (this._tourResizeHandler) {
                window.removeEventListener('resize', this._tourResizeHandler);
            }

            // 添加新的滾動和視窗調整監聽器
            this._tourScrollHandler = updatePositions;
            this._tourResizeHandler = updatePositions;
            window.addEventListener('scroll', this._tourScrollHandler, true);
            window.addEventListener('resize', this._tourResizeHandler);
        }, this.TOUR_SCROLL_DELAY);
    },

    restartTour() {
        // 重置完成狀態
        localStorage.removeItem('debateTourCompleted');

        // 關閉側邊欄
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('hidden')) {
            sidebar.classList.add('hidden');
        }

        // 啟動教學
        this.startTour();
    },

    // --- CONSTANTS ---
    initAmbientBackground() {
        // 檢查是否已經存在，避免重複添加
        if (document.querySelector('.ambient-canvas')) return;

        const canvas = document.createElement('div');
        canvas.className = 'ambient-canvas';
        canvas.innerHTML = `
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
        `;
        // 插入到 body 的最前面 (作為背景)
        document.body.prepend(canvas);
    },
    debateFormatGroups: {
        "特殊賽制": {
            "辯革盃 (九辯位自由排序制)": [
                { name: "賽前準備及介紹", type: "announcement", script: "歡迎各位來到辯革盃比賽。本次比賽辯題為：「{{debate_topic}}」。正方代表隊：{{positive_team_name}}，反方代表隊：{{negative_team_name}}。比賽將於鈴響一分鐘後開始。" },
                { name: "正方立論", type: "choice_speech", choosingTeam: 'positive', fixedAction: '立論', duration: 270, graceEndAction: "auto_start", baseScript: "首先，有請正方上台進行立論，時間四分半，有請。", baseTimerLabel: "正方立論" },
                { name: "反方立論", type: "choice_speech", choosingTeam: 'negative', fixedAction: '立論', duration: 270, graceEndAction: "auto_start", baseScript: "接著，再請反方上台進行立論，時間四分半，有請。", baseTimerLabel: "反方立論" },
                { name: "接替環節宣告", type: "announcement", script: "感謝雙方的立論。接下來進入接替環節。" },
                { name: "正方接替 1", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "請正方決定此環節為申論或質答。正方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "正方 {{selected_action_type}}" },
                { name: "反方接替 1", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝正方辯士。請反方決定此環節為申論或質答。反方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "反方 {{selected_action_type}}" },
                { name: "正方接替 2", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝反方辯士。請正方決定此環節為申論或質答。正方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "正方 {{selected_action_type}}" },
                { name: "反方接替 2", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝正方辯士。請反方決定此環節為申論或質答。反方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "反方 {{selected_action_type}}" },
                { name: "正方接替 3", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝反方辯士。請正方決定此環節為申論或質答。正方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "正方 {{selected_action_type}}" },
                { name: "反方接替 3", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝正方辯士。請反方決定此環節為申論或質答。反方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "反方 {{selected_action_type}}" },
                { name: "正方接替 4", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝反方辯士。請正方決定此環節為申論或質答。正方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "正方 {{selected_action_type}}" },
                { name: "反方接替 4", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝正方辯士。請反方決定此環節為申論或質答。反方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "反方 {{selected_action_type}}" },
                { name: "正方接替 5", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝反方辯士。請正方決定此環節為申論或質答。正方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "正方 {{selected_action_type}}" },
                { name: "反方接替 5", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝正方辯士。請反方決定此環節為申論或質答。反方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "反方 {{selected_action_type}}" },
                { name: "正方接替 6", type: "choice_speech", choosingTeam: 'positive', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝反方辯士。請正方決定此環節為申論或質答。正方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "正方 {{selected_action_type}}" },
                { name: "反方接替 6", type: "choice_speech", choosingTeam: 'negative', actionChoices: ['申論', '質答'], duration: 270, graceEndAction: "auto_start", baseScript: "感謝正方辯士。請反方決定此環節為申論或質答。反方選擇 {{selected_action_type}}，四分半，有請。", baseTimerLabel: "反方 {{selected_action_type}}" },
                { name: "比賽結束", type: "announcement", script: "感謝反方辯士。比賽環節到此結束，感謝各位。" },
            ],
            "風雩盃": [
                {
                    name: "賽前介紹與規則說明",
                    type: "announcement",
                    script: `大家好！歡迎來到風雩盃中學辯論錦標賽。
                本次比賽的辯題為：「{{debate_topic}}」。
                正方由 {{positive_team_name}} 擔任，反方由 {{negative_team_name}} 擔任。`
                },
                { name: "正方一辯 申論", type: "speech_auto", duration: 210, script: "首先請正方一辯上台申論，時間三分半，有請！", timerLabel: "正方一辯 申論", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 180, script: "接著請反方二辯上台質詢正方一辯，時間三分鐘，有請！", timerLabel: "反方二辯 質詢", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 210, script: "再來請反方一辯上台申論，時間三分半，有請！", timerLabel: "反方一辯 申論", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 180, script: "再來請正方三辯上台質詢反方一辯，時間三分鐘，有請！", timerLabel: "正方三辯 質詢", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 180, script: "再來請正方二辯上台申論，時間三分鐘，有請！", timerLabel: "正方二辯 申論", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 180, script: "再來請反方三辯上台質詢正方二辯，時間三分鐘，有請！", timerLabel: "反方三辯 質詢", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 180, script: "再來請反方二辯上台申論，時間三分鐘，有請！", timerLabel: "反方二辯 申論", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 180, script: "再來請正方一辯上台質詢反方二辯，時間三分鐘，有請！", timerLabel: "正方一辯 質詢", graceEndAction: "auto_start" },
                {
                    name: "對辯環節 (雙方四辯)",
                    type: "free_debate",
                    duration: 120,
                    script: `接下來進行對辯環節，此環節中，選手毋須登台，雙方四辯將輪流起立發言。
                在此環節中雙方各有兩分鐘的時間，每當一方發言結束，另一方將開始計時。
                首先由正方四辯開始提問，有請。`
                },
                { name: "正方三辯 申論", type: "speech_auto", duration: 180, script: "對辯環節結束。接著請正方三辯上台申論，時間三分鐘，有請！", timerLabel: "正方三辯 申論", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 180, script: "再來請反方一辯上台質詢正方三辯，時間三分鐘，有請！", timerLabel: "反方一辯 質詢", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 180, script: "再來請反方三辯上台申論，時間三分鐘，有請！", timerLabel: "反方三辯 申論", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 180, script: "再來請正方二辯上台質詢反方三辯，時間三分鐘，有請！", timerLabel: "正方二辯 質詢", graceEndAction: "auto_start" },
                {
                    name: "自由辯論環節",
                    type: "free_debate",
                    duration: 240,
                    script: `感謝雙方辯士精彩的交鋒，接著是自由辯論環節，雙方辯士將輪流發言。
                在此階段雙方各有四分鐘的時間，每當一方發言結束，另一方則開始計時。
                首先由正方辯士開始提問，有請。`
                },
                { name: "反方四辯 總結", type: "speech_auto", duration: 240, script: "自由辯論環節結束。接著進入比賽的最後一個階段，總結陳詞。由反方先行上台總結，有請反方四辯，時間四分鐘。", timerLabel: "反方總結", graceEndAction: "auto_start" },
                { name: "正方四辯 總結", type: "speech_auto", duration: 240, script: "感謝反方四辯精彩的發言，接著請正方四辯上台總結，時間四分鐘。", timerLabel: "正方總結", graceEndAction: "auto_start" },
                {
                    name: "比賽結束",
                    type: "announcement",
                    script: "感謝正方四辯精彩的發言，主席宣布本場比賽到此告一段落。"
                }
            ]
        },
        "新式奧瑞岡 (含結辯)": {
            "新式奧瑞岡三三三制": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡三三三制。", timerLabel: null },
                { name: "結辯順序抽籤", type: "draw_rebuttal_order", duration: null, script: "首先，我們來進行結辯順序抽籤。請點擊下方按鈕開始抽籤。", timerLabel: null },
                { name: "開賽預備", type: "manual_prep", duration: 60, script: "結辯順序抽籤完畢。主席宣布，比賽開始。正方一辯準備上台申論，計時一分鐘準備時間。", timerLabel: "整體準備時間" },
                { name: "正方一辯 申論", type: "speech_auto", duration: 180, script: "準備時間結束。現在請正方一辯上臺申論，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 180, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請反方一辯上臺申論，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 180, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請正方二辯上臺申論，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 180, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請反方二辯上臺申論，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 180, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請正方三辯上臺申論，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 180, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請反方三辯上臺申論，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 180, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "結辯準備", type: "manual_prep", duration: 180, script: "申論質詢階段完畢。先前抽籤結果為 {{first_rebuttal_team_name}} 先結辯。雙方將有三分鐘準備結辯。計時開始。", timerLabel: "結辯準備時間" },
                { name: "先結辯方 結辯", type: "speech_auto", duration: 180, script: "準備時間到。現在請 {{first_rebuttal_team_name}} 代表上臺結辯，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "後結辯方 結辯", type: "speech_auto", duration: 180, script: "感謝 {{first_rebuttal_team_name}} 代表。現在請 {{second_rebuttal_team_name}} 代表上臺結辯，時間三分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡三三三制(三分半)": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡三三三制(三分半)。", timerLabel: null },
                { name: "結辯順序抽籤", type: "draw_rebuttal_order", duration: null, script: "首先，我們來進行結辯順序抽籤。請點擊下方按鈕開始抽籤。", timerLabel: null },
                { name: "開賽預備", type: "manual_prep", duration: 60, script: "結辯順序抽籤完畢。主席宣布，比賽開始。正方一辯準備上台申論，計時一分鐘準備時間。", timerLabel: "整體準備時間" },
                { name: "正方一辯 申論", type: "speech_auto", duration: 210, script: "準備時間結束。現在請正方一辯上臺申論，時間三分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 210, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間三分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請反方一辯上臺申論，時間三分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 210, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間三分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請正方二辯上臺申論，時間三分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 210, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間三分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請反方二辯上臺申論，時間三分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 210, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間三分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請正方三辯上臺申論，時間三分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 210, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間三分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請反方三辯上臺申論，時間三分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 210, script: "感謝{{negative_team_name}}三辯。接著請{{positive_team_name}}二辯上臺質詢{{negative_team_name}}三辯，時間三分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "結辯準備", type: "manual_prep", duration: 180, script: "申論質詢階段完畢。先前抽籤結果為 {{first_rebuttal_team_name}} 先結辯。雙方將有三分鐘準備結辯。計時開始。", timerLabel: "結辯準備時間" },
                { name: "先結辯方 結辯", type: "speech_auto", duration: 210, script: "準備時間到。現在請 {{first_rebuttal_team_name}} 代表上臺結辯，時間三分半。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "後結辯方 結辯", type: "speech_auto", duration: 210, script: "感謝 {{first_rebuttal_team_name}} 代表。現在請 {{second_rebuttal_team_name}} 代表上臺結辯，時間三分半。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡四四四制": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡四四四制。", timerLabel: null },
                { name: "結辯順序抽籤", type: "draw_rebuttal_order", duration: null, script: "首先，我們來進行結辯順序抽籤。請點擊下方按鈕開始抽籤。", timerLabel: null },
                { name: "開賽預備", type: "manual_prep", duration: 60, script: "結辯順序抽籤完畢。主席宣布，比賽開始。正方一辯準備上台申論，計時一分鐘準備時間。", timerLabel: "整體準備時間" },
                { name: "正方一辯 申論", type: "speech_auto", duration: 240, script: "準備時間結束。現在請正方一辯上臺申論，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 240, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請反方一辯上臺申論，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 240, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請正方二辯上臺申論，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 240, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請反方二辯上臺申論，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 240, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請正方三辯上臺申論，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 240, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請反方三辯上臺申論，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 240, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "結辯準備", type: "manual_prep", duration: 180, script: "申論質詢階段完畢。先前抽籤結果為 {{first_rebuttal_team_name}} 先結辯。雙方將有三分鐘準備結辯。計時開始。", timerLabel: "結辯準備時間" },
                { name: "先結辯方 結辯", type: "speech_auto", duration: 240, script: "準備時間到。現在請 {{first_rebuttal_team_name}} 代表上臺結辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "後結辯方 結辯", type: "speech_auto", duration: 240, script: "感謝 {{first_rebuttal_team_name}} 代表。現在請 {{second_rebuttal_team_name}} 代表上臺結辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡四四四制(四分半)": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡四四四制(四分半)。", timerLabel: null },
                { name: "結辯順序抽籤", type: "draw_rebuttal_order", duration: null, script: "首先，我們來進行結辯順序抽籤。請點擊下方按鈕開始抽籤。", timerLabel: null },
                { name: "開賽預備", type: "manual_prep", duration: 60, script: "結辯順序抽籤完畢。主席宣布，比賽開始。正方一辯準備上台申論，計時一分鐘準備時間。", timerLabel: "整體準備時間" },
                { name: "正方一辯 申論", type: "speech_auto", duration: 270, script: "準備時間結束。現在請正方一辯上臺申論，時間四分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 270, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間四分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 270, script: "感謝雙方。現在請反方一辯上臺申論，時間四分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 270, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間四分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 270, script: "感謝雙方。現在請正方二辯上臺申論，時間四分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 270, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間四分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 270, script: "感謝雙方。現在請反方二辯上臺申論，時間四分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 270, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間四分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 270, script: "感謝雙方。現在請正方三辯上臺申論，時間四分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 270, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間四分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 270, script: "感謝雙方。現在請反方三辯上臺申論，時間四分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 270, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間四分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "結辯準備", type: "manual_prep", duration: 180, script: "申論質詢階段完畢。先前抽籤結果為 {{first_rebuttal_team_name}} 先結辯。雙方將有三分鐘準備結辯。計時開始。", timerLabel: "結辯準備時間" },
                { name: "先結辯方 結辯", type: "speech_auto", duration: 270, script: "準備時間到。現在請 {{first_rebuttal_team_name}} 代表上臺結辯，時間四分半。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "後結辯方 結辯", type: "speech_auto", duration: 270, script: "感謝 {{first_rebuttal_team_name}} 代表。現在請 {{second_rebuttal_team_name}} 代表上臺結辯，時間四分半。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡五五四制": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡五五四制。", timerLabel: null },
                { name: "結辯順序抽籤", type: "draw_rebuttal_order", duration: null, script: "首先，我們來進行結辯順序抽籤。請點擊下方按鈕開始抽籤。", timerLabel: null },
                { name: "開賽預備", type: "manual_prep", duration: 60, script: "結辯順序抽籤完畢。主席宣布，比賽開始。正方一辯準備上台申論，計時一分鐘準備時間。", timerLabel: "整體準備時間" },
                { name: "正方一辯 申論", type: "speech_auto", duration: 300, script: "準備時間結束。現在請正方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 300, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請反方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 300, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請正方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 300, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請反方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 300, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請正方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 300, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請反方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 300, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "結辯準備", type: "manual_prep", duration: 180, script: "申論質詢階段完畢。先前抽籤結果為 {{first_rebuttal_team_name}} 先結辯。雙方將有三分鐘準備結辯。計時開始。", timerLabel: "結辯準備時間" },
                { name: "先結辯方 結辯", type: "speech_auto", duration: 240, script: "準備時間到。現在請 {{first_rebuttal_team_name}} 代表上臺結辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "後結辯方 結辯", type: "speech_auto", duration: 240, script: "感謝 {{first_rebuttal_team_name}} 代表。現在請 {{second_rebuttal_team_name}} 代表上臺結辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡五五四制(五分半)": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡五五四制(五分半)。", timerLabel: null },
                { name: "結辯順序抽籤", type: "draw_rebuttal_order", duration: null, script: "首先，我們來進行結辯順序抽籤。請點擊下方按鈕開始抽籤。", timerLabel: null },
                { name: "開賽預備", type: "manual_prep", duration: 60, script: "結辯順序抽籤完畢。主席宣布，比賽開始。正方一辯準備上台申論，計時一分鐘準備時間。", timerLabel: "整體準備時間" },
                { name: "正方一辯 申論", type: "speech_auto", duration: 330, script: "準備時間結束。現在請正方一辯上臺申論，時間五分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 330, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請反方一辯上臺申論，時間五分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 330, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請正方二辯上臺申論，時間五分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 330, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請反方二辯上臺申論，時間五分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 330, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請正方三辯上臺申論，時間五分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 330, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請反方三辯上臺申論，時間五分半。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 330, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "結辯準備", type: "manual_prep", duration: 180, script: "申論質詢階段完畢。先前抽籤結果為 {{first_rebuttal_team_name}} 先結辯。雙方將有三分鐘準備結辯。計時開始。", timerLabel: "結辯準備時間" },
                { name: "先結辯方 結辯", type: "speech_auto", duration: 240, script: "準備時間到。現在請 {{first_rebuttal_team_name}} 代表上臺結辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "後結辯方 結辯", type: "speech_auto", duration: 240, script: "感謝 {{first_rebuttal_team_name}} 代表。現在請 {{second_rebuttal_team_name}} 代表上臺結辯，時間四分鐘。您有一分鐘時間開始發言。", timerLabel: "結辯時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
        },
        "新式奧瑞岡 (無結辯)": {
            "新式奧瑞岡三三三制(無結辯)": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡五五四制。", timerLabel: null },
                { name: "正方一辯 申論", type: "speech_auto", duration: 180, script: "準備時間結束。現在請正方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 180, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請反方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 180, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請正方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 180, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請反方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 180, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請正方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 180, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 180, script: "感謝雙方。現在請反方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 180, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡三三三制(三分半，無結辯)": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡五五四制。", timerLabel: null },
                { name: "正方一辯 申論", type: "speech_auto", duration: 210, script: "準備時間結束。現在請正方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 210, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請反方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 210, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請正方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 210, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請反方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 210, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請正方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 210, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 210, script: "感謝雙方。現在請反方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 210, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡四四四制(無結辯)": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡五五四制。", timerLabel: null },
                { name: "正方一辯 申論", type: "speech_auto", duration: 240, script: "準備時間結束。現在請正方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 240, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請反方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 240, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請正方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 240, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請反方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 240, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請正方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 240, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 240, script: "感謝雙方。現在請反方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 240, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡四四四制(四分半，無結辯)": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡五五四制。", timerLabel: null },
                { name: "正方一辯 申論", type: "speech_auto", duration: 270, script: "準備時間結束。現在請正方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 330, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請反方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 330, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請正方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 330, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請反方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 330, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請正方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 330, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請反方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 330, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡五五四制(無結辯)": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡五五四制。", timerLabel: null },
                { name: "開賽預備", type: "manual_prep", duration: 60, script: "結辯順序抽籤完畢。主席宣布，比賽開始。正方一辯準備上台申論，計時一分鐘準備時間。", timerLabel: "整體準備時間" },
                { name: "正方一辯 申論", type: "speech_auto", duration: 300, script: "準備時間結束。現在請正方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 300, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請反方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 300, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請正方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 300, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請反方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 300, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請正方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 300, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 300, script: "感謝雙方。現在請反方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 300, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
            "新式奧瑞岡五五四制(五分半，無結辯)": [
                { name: "賽前準備", type: "announcement", duration: null, script: "歡迎來到本次辯論比賽。本次辯題為：「{{debate_topic}}」。正方代表隊是 {{positive_team_name}}，反方代表隊是 {{negative_team_name}}。比賽採新式奧瑞岡五五四制。", timerLabel: null },
                { name: "正方一辯 申論", type: "speech_auto", duration: 330, script: "準備時間結束。現在請正方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 質詢 正方一辯", type: "speech_auto", duration: 330, script: "感謝正方一辯。接著請反方二辯上臺質詢正方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請反方一辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 質詢 反方一辯", type: "speech_auto", duration: 330, script: "感謝反方一辯。接著請正方三辯上臺質詢反方一辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請正方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 質詢 正方二辯", type: "speech_auto", duration: 330, script: "感謝正方二辯。接著請反方三辯上臺質詢正方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方二辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請反方二辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方一辯 質詢 反方二辯", type: "speech_auto", duration: 330, script: "感謝反方二辯。接著請正方一辯上臺質詢反方二辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方三辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請正方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方一辯 質詢 正方三辯", type: "speech_auto", duration: 330, script: "感謝正方三辯。接著請反方一辯上臺質詢正方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "反方三辯 申論", type: "speech_auto", duration: 330, script: "感謝雙方。現在請反方三辯上臺申論，時間五分鐘。您有一分鐘時間開始發言。", timerLabel: "申論時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "正方二辯 質詢 反方三辯", type: "speech_auto", duration: 330, script: "感謝反方三辯。接著請正方二辯上臺質詢反方三辯，時間五分半。您有一分鐘時間開始發言。", timerLabel: "質詢時間", graceEndAction: "auto_start", graceEndAction: "auto_start" },
                { name: "比賽結束宣告", type: "announcement", duration: null, script: "感謝雙方結辯。本場比賽所有賽程到此結束。", timerLabel: null },
            ],
        },
        "新加坡制": {
            "新加坡制 (正方開場3min, 自由辯4min)": [
                { name: "賽前介紹", type: "announcement", script: "歡迎各位。本次比賽採新加坡制，辯題為：「{{debate_topic}}」。正方為{{positive_team_name}}，反方為{{negative_team_name}}。" },
                { name: "正方一辯 陳詞", type: "speech_auto", duration: 180, script: "請正方一辯上臺陳詞，時間三分鐘。", timerLabel: "正方一辯 陳詞", graceEndAction: "auto_start" },
                { name: "反方一辯 陳詞", type: "speech_auto", duration: 180, script: "請反方一辯上臺陳詞，時間三分鐘。", timerLabel: "反方一辯 陳詞", graceEndAction: "auto_start" },
                { name: "正方二辯 陳詞", type: "speech_auto", duration: 180, script: "請正方二辯上臺陳詞，時間三分鐘。", timerLabel: "正方二辯 陳詞", graceEndAction: "auto_start" },
                { name: "反方二辯 陳詞", type: "speech_auto", duration: 180, script: "請反方二辯上臺陳詞，時間三分鐘。", timerLabel: "反方二辯 陳詞", graceEndAction: "auto_start" },
                { name: "正方三辯 陳詞", type: "speech_auto", duration: 180, script: "請正方三辯上臺陳詞，時間三分鐘。", timerLabel: "正方三辯 陳詞", graceEndAction: "auto_start" },
                { name: "反方三辯 陳詞", type: "speech_auto", duration: 180, script: "請反方三辯上臺陳詞，時間三分鐘。", timerLabel: "反方三辯 陳詞", graceEndAction: "auto_start" },
                { name: "自由辯論", type: "free_debate", duration: 240, script: "接下來進入自由辯論環節，雙方各有四分鐘發言時間。" },
                { name: "反方四辯 總結", type: "speech_auto", duration: 240, script: "請反方四辯上臺總結，時間四分鐘。", timerLabel: "反方總結", graceEndAction: "auto_start" },
                { name: "正方四辯 總結", type: "speech_auto", duration: 240, script: "請正方四辯上臺總結，時間四分鐘。", timerLabel: "正方總結", graceEndAction: "auto_start" },
                { name: "比賽結束", type: "announcement", script: "比賽結束，感謝各位。" }
            ],
            "新加坡制 (正方開場4min, 自由辯4min)": [
                { name: "賽前介紹", type: "announcement", script: "歡迎各位。本次比賽採新加坡制，辯題為：「{{debate_topic}}」。正方為{{positive_team_name}}，反方為{{negative_team_name}}。" },
                { name: "正方一辯 陳詞", type: "speech_auto", duration: 240, script: "請正方一辯上臺陳詞，時間四分鐘。", timerLabel: "正方一辯 陳詞", graceEndAction: "auto_start" },
                { name: "反方一辯 陳詞", type: "speech_auto", duration: 180, script: "請反方一辯上臺陳詞，時間三分鐘。", timerLabel: "反方一辯 陳詞", graceEndAction: "auto_start" },
                { name: "正方二辯 陳詞", type: "speech_auto", duration: 180, script: "請正方二辯上臺陳詞，時間三分鐘。", timerLabel: "正方二辯 陳詞", graceEndAction: "auto_start" },
                { name: "反方二辯 陳詞", type: "speech_auto", duration: 180, script: "請反方二辯上臺陳詞，時間三分鐘。", timerLabel: "反方二辯 陳詞", graceEndAction: "auto_start" },
                { name: "正方三辯 陳詞", type: "speech_auto", duration: 180, script: "請正方三辯上臺陳詞，時間三分鐘。", timerLabel: "正方三辯 陳詞", graceEndAction: "auto_start" },
                { name: "反方三辯 陳詞", type: "speech_auto", duration: 180, script: "請反方三辯上臺陳詞，時間三分鐘。", timerLabel: "反方三辯 陳詞", graceEndAction: "auto_start" },
                { name: "自由辯論", type: "free_debate", duration: 240, script: "接下來進入自由辯論環節，雙方各有四分鐘發言時間。" },
                { name: "反方四辯 總結", type: "speech_auto", duration: 240, script: "請反方四辯上臺總結，時間四分鐘。", timerLabel: "反方總結", graceEndAction: "auto_start" },
                { name: "正方四辯 總結", type: "speech_auto", duration: 240, script: "請正方四辯上臺總結，時間四分鐘。", timerLabel: "正方總結", graceEndAction: "auto_start" },
                { name: "比賽結束", type: "announcement", script: "比賽結束，感謝各位。" }
            ],
            "新加坡制 (正方開場4min, 自由辯5min)": [
                { name: "賽前介紹", type: "announcement", script: "歡迎各位。本次比賽採新加坡制，辯題為：「{{debate_topic}}」。正方為{{positive_team_name}}，反方為{{negative_team_name}}。" },
                { name: "正方一辯 陳詞", type: "speech_auto", duration: 240, script: "請正方一辯上臺陳詞，時間四分鐘。", timerLabel: "正方一辯 陳詞", graceEndAction: "auto_start" },
                { name: "反方一辯 陳詞", type: "speech_auto", duration: 180, script: "請反方一辯上臺陳詞，時間三分鐘。", timerLabel: "反方一辯 陳詞", graceEndAction: "auto_start" },
                { name: "正方二辯 陳詞", type: "speech_auto", duration: 180, script: "請正方二辯上臺陳詞，時間三分鐘。", timerLabel: "正方二辯 陳詞", graceEndAction: "auto_start" },
                { name: "反方二辯 陳詞", type: "speech_auto", duration: 180, script: "請反方二辯上臺陳詞，時間三分鐘。", timerLabel: "反方二辯 陳詞", graceEndAction: "auto_start" },
                { name: "正方三辯 陳詞", type: "speech_auto", duration: 180, script: "請正方三辯上臺陳詞，時間三分鐘。", timerLabel: "正方三辯 陳詞", graceEndAction: "auto_start" },
                { name: "反方三辯 陳詞", type: "speech_auto", duration: 180, script: "請反方三辯上臺陳詞，時間三分鐘。", timerLabel: "反方三辯 陳詞", graceEndAction: "auto_start" },
                { name: "自由辯論", type: "free_debate", duration: 300, script: "接下來進入自由辯論環節，雙方各有五分鐘發言時間。" },
                { name: "反方四辯 總結", type: "speech_auto", duration: 240, script: "請反方四辯上臺總結，時間四分鐘。", timerLabel: "反方總結", graceEndAction: "auto_start" },
                { name: "正方四辯 總結", type: "speech_auto", duration: 240, script: "請正方四辯上臺總結，時間四分鐘。", timerLabel: "正方總結", graceEndAction: "auto_start" },
                { name: "比賽結束", type: "announcement", script: "比賽結束，感謝各位。" }
            ]
        },
    },
    /**
     * 將當前狀態的深拷貝存入歷史紀錄
     * @param {string} actionName - 觸發儲存的動作名稱，方便除錯
     */
    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.state.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen Wake Lock active');
                this.state.wakeLock.addEventListener('release', () => {
                    console.log('Screen Wake Lock released');
                });
            }
        } catch (err) {
            // 某些瀏覽器如果電量過低可能會拒絕，這裡僅紀錄錯誤不阻擋程式執行
            console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
        }
    },
    saveState(actionName = 'unknown') {
        try {
            // [關鍵修復] 完全手動建立可序列化的狀態物件
            // 不使用展開運算符來避免複製無法序列化的物件
            const stateToSave = {
                // 基本狀態值
                currentView: this.state.currentView,
                currentStageIndex: this.state.currentStageIndex,
                timeRemaining: this.state.timeRemaining,
                isRunning: this.state.isRunning,
                isPaused: this.state.isPaused,
                totalElapsed: this.state.totalElapsed,
                debateTopic: this.state.debateTopic,
                positiveTeamName: this.state.positiveTeamName,
                negativeTeamName: this.state.negativeTeamName,
                selectedFormat: this.state.selectedFormat,
                stages: JSON.parse(JSON.stringify(this.state.stages || [])),
                formatFilterTag: this.state.formatFilterTag,

                // 設定值
                settings: this.state.settings ? { ...this.state.settings } : {},
                audioSourceModes: this.state.audioSourceModes ? { ...this.state.audioSourceModes } : {},

                // 自由辯論狀態
                freeDebate: this.state.freeDebate ? {
                    isActive: this.state.freeDebate.isActive,
                    currentTeam: this.state.freeDebate.currentTeam,
                    posTime: this.state.freeDebate.posTime,
                    negTime: this.state.freeDebate.negTime,
                    totalTime: this.state.freeDebate.totalTime
                } : null,

                // UI 狀態
                theme: this.state.theme,
                showTranscription: this.state.showTranscription,

                // 不可序列化的物件設為 null
                wakeLock: null,
                sortableInstance: null,
                pip: { isActive: this.state.pip?.isActive || false, videoElement: null },
                audioDetection: {
                    isEnabled: this.state.audioDetection?.isEnabled || false,
                    isListening: this.state.audioDetection?.isListening || false,
                    vad: null,
                    stream: null,
                    analyser: null
                },
                recording: {
                    isRecording: this.state.recording?.isRecording || false,
                    isPaused: this.state.recording?.isPaused || false,
                    mediaRecorder: null,
                    mediaStream: null,
                    micAudioTrack: null,
                    recordedChunks: [],
                    audioBlob: null
                },
                sharedDisplay: {
                    isSharing: this.state.sharedDisplay?.isSharing || false,
                    stream: null,
                    audioTrack: null
                },
                projector: {
                    isActive: this.state.projector?.isActive || false,
                    mode: this.state.projector?.mode || null,
                    channel: null,
                    displayWindow: null,
                    presentationConnection: null,
                    heartbeatInterval: null,
                    windowCheckInterval: null
                },

                // 教學狀態
                tour: this.state.tour ? {
                    isActive: this.state.tour.isActive,
                    currentStep: this.state.tour.currentStep
                } : { isActive: false, currentStep: 0 }
            };

            // 安全地進行深拷貝
            const stateSnapshot = structuredClone(stateToSave);

            // 存入歷史紀錄
            this.state.history.push(stateSnapshot);

            // [關鍵優化] 限制歷史紀錄長度 (降為 10 步)
            if (this.state.history.length > 10) {
                this.state.history.shift();
            }
        } catch (e) {
            console.error("Failed to save state:", e);
        }
    },
    /**
     * 從歷史紀錄中還原上一個狀態
     */
    initSpotlightEffect() {
        // [效能優化] 使用 throttle + requestAnimationFrame 減少重繪
        let ticking = false;
        let lastX = 0, lastY = 0;

        document.addEventListener('mousemove', (e) => {
            lastX = e.clientX;
            lastY = e.clientY;

            if (!ticking) {
                requestAnimationFrame(() => {
                    // 只選取可見的玻璃卡片
                    const cards = document.querySelectorAll('.glass-panel');
                    const len = cards.length;

                    for (let i = 0; i < len; i++) {
                        const card = cards[i];
                        const rect = card.getBoundingClientRect();

                        // [優化] 只更新滑鼠附近的卡片
                        if (lastX >= rect.left - 50 && lastX <= rect.right + 50 &&
                            lastY >= rect.top - 50 && lastY <= rect.bottom + 50) {
                            card.style.setProperty('--mouse-x', `${lastX - rect.left}px`);
                            card.style.setProperty('--mouse-y', `${lastY - rect.top}px`);
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    },
    restoreState() {
        if (this.state.history.length === 0) {
            this.showNotification("沒有更早的操作可以復原", "info");
            return;
        }

        // 1. 暫停當前的計時器
        this.clearAllTimers();

        // 2. 取出上一個狀態 (這個狀態裡現在「沒有」history 屬性)
        const previousState = this.state.history.pop();

        // 3. [關鍵] 備份當前運作中的硬體物件與歷史紀錄
        const preservedRuntime = {
            history: this.state.history, // 保留當前的歷史紀錄陣列 (因為 previousState 裡面沒有)
            wakeLock: this.state.wakeLock,
            pip: this.state.pip, // 保留視窗參照
            sortableInstance: this.state.sortableInstance,

            // 保留 VAD 連線，避免復原時斷線
            audioDetection: {
                ...previousState.audioDetection, // 使用舊的設定值 (如閾值)
                vad: this.state.audioDetection.vad,
                stream: this.state.audioDetection.stream,
                analyser: this.state.audioDetection.analyser,
                isActive: this.state.audioDetection.isActive
            },

            // 保留錄音連線與資料，避免復原時錄音被切斷或資料遺失
            recording: {
                ...previousState.recording, // 使用舊的設定
                mediaRecorder: this.state.recording.mediaRecorder,
                mediaStream: this.state.recording.mediaStream,
                micAudioTrack: this.state.recording.micAudioTrack,
                isRecording: this.state.recording.isRecording,
                recordedChunks: this.state.recording.recordedChunks, // ★ 重要：保留目前的錄音數據
                audioBlob: this.state.recording.audioBlob
            },

            // 保留螢幕分享
            sharedDisplay: {
                ...previousState.sharedDisplay,
                stream: this.state.sharedDisplay.stream,
                audioTrack: this.state.sharedDisplay.audioTrack,
                isInitialized: this.state.sharedDisplay.isInitialized
            }
        };

        // 4. 還原狀態 (舊狀態 + 保留的 Runtime 物件)
        this.state = { ...previousState, ...preservedRuntime };

        // 5. 重新渲染
        this.render();

        // 6. 恢復計時器邏輯
        const { type, isPaused, timeLeft } = this.state.timer;
        if ((type === 'main' || type === 'grace' || type === 'manual_prep') && !isPaused && timeLeft > 0) {
            const intervalType = type === 'grace' ? 'graceInterval' : 'interval';
            this.state.timer[intervalType] = setInterval(this.runTimerInterval.bind(this), 1000);
        }

        // 恢復自由辯論計時器
        if (this.state.freeDebate && this.state.freeDebate.activeTeam && !this.state.freeDebate.isPaused) {
            this.state.freeDebate.interval = setInterval(this.runFreeDebateInterval.bind(this), 1000);
        }

        this.showNotification("已復原上一個操作", "success");
    },
    /**
     * Helper function to convert hex color to rgba
     * @param {string} hex - The hex color code.
     * @param {number} alpha - The alpha transparency (0 to 1).
     * @returns {string} - The rgba color string.
     */
    hexToRgba(hex, alpha) {
        let r = 0, g = 0, b = 0;
        if (hex.length == 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length == 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    /**
     * Applies a theme object to the CSS variables.
     * @param {object} colors - An object with accent, accentHover, accentLight properties.
     */
    applyTheme(colors) {
        if (!colors || !colors.accent) {
            console.warn("applyTheme called with invalid colors object.");
            return;
        }
        const root = document.documentElement;
        root.style.setProperty('--color-accent', colors.accent);
        root.style.setProperty('--color-accent-hover', colors.accentHover);
        root.style.setProperty('--color-accent-light', colors.accentLight);
        root.style.setProperty('--color-focus-shadow', this.hexToRgba(colors.accent, 0.25));

        // Also update PiP if active
        if (this.state.pip.isActive) {
            this.renderPipCanvas();
        }
    },

    /**
     * Theme definitions
     */
    themes: {
        default: {
            colors: {
                accent: '#6366f1',
                accentHover: '#4f46e5',
                accentLight: '#818cf8'
            }
        }
    },

    /**
     * Saves the custom theme colors to localStorage.
     * @param {object} colors 
     */
    saveCustomTheme(colors) {
        localStorage.setItem('debateTimerCustomTheme', JSON.stringify(colors));
    },

    /**
     * Loads and applies theme from localStorage on startup.
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('debateTimerCustomTheme');
        if (savedTheme) {
            try {
                const customColors = JSON.parse(savedTheme);
                this.applyTheme(customColors);
            } catch (e) {
                console.error("Failed to parse custom theme from localStorage", e);
            }
        } else {
            // Apply default theme if no custom theme is saved
            this.applyTheme(this.themes.default.colors);
        }
    },
    // --- CORE METHODS ---
    init() {
        document.getElementById('app').style.display = 'flex';
        this.mainContent = document.getElementById('main-content');
        this.pipCanvas = document.getElementById('pipCanvas'); // New
        if (this.pipCanvas) { // New
            this.pipCtx = this.pipCanvas.getContext('2d');
        }
        this.requestWakeLock();
        // 當使用者切換分頁或最小化後再回來，鎖定會自動失效，需重新請求
        document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible') {
                await this.requestWakeLock();
            }
        });
        //this.showPromotionModal();
        this.checkForSharedFlow()
        this.initAudioRecording();
        this.loadTheme();
        this.initSpeechRecognition();
        this.initSpeechSynthesis();
        this.initProjectorChannel(); // 初始化投影模式頻道
        this.loadState();
        this.render();
        this.addEventListeners();
        this.initAmbientBackground();
        this.initSpotlightEffect();
        this.initOnboarding();
    },

    loadState() {
        const theme = localStorage.getItem('debateTimerTheme');
        // 根據儲存的主題或系統偏好設定
        if (theme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        } else if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
        }
        this.state.isAutoMode = localStorage.getItem('debateAutoMode') !== 'false';
        this.state.enableSpeechDetection = localStorage.getItem('debateSpeechDetection') !== 'false';
        this.state.enableSpeech = localStorage.getItem('debateSpeech') !== 'false';
        const savedGraceDuration = localStorage.getItem('debateGraceDuration');
        if (savedGraceDuration) {
            this.state.customGraceDuration = parseInt(savedGraceDuration, 10);
        }
        const savedModes = localStorage.getItem('debateAudioSourceModes');
        if (savedModes) {
            try {
                this.state.audioSourceModes = JSON.parse(savedModes);
            } catch (e) {
                console.error("Failed to parse saved audio modes.");
            }
        }
    },

    // --- EVENT HANDLING ---
    addEventListeners() {
        document.body.addEventListener('click', this.handleGlobalClick.bind(this));
        document.body.addEventListener('change', this.handleGlobalChange.bind(this));
        window.addEventListener('keydown', this.handleKeyDown.bind(this));

        // 監聯辯士名稱輸入變更
        document.body.addEventListener('input', this.handleDebaterNameInput.bind(this));

        // 監聽裁判名稱輸入變更
        document.body.addEventListener('input', this.handleJudgeNameInput.bind(this));

        // [效能優化] 使用 passive 提升觸控/滾輪效能
        document.body.addEventListener('touchstart', () => { }, { passive: true });
        document.body.addEventListener('touchmove', () => { }, { passive: true });

        // [關鍵修正] 監聽全螢幕狀態改變 (包含按 Esc 鍵退出的情況)
        document.addEventListener('fullscreenchange', () => {
            const isFullscreen = !!document.fullscreenElement;

            // 如果退出了全螢幕，強制關閉投影模式樣式，讓控制列顯示出來
            if (!isFullscreen) {
                document.body.classList.remove('presentation-mode');
                App.state.isPresentationMode = false;
            }

            // 重新渲染控制列以確保狀態正確（無論進入或退出全螢幕都需更新）
            if (App.state.currentView === 'debate') App.renderDebateControls();
            if (App.state.currentView === 'free_debate') App.renderFreeDebateControls();

            this.renderHeader(); // 更新 Header 上的狀態 (如果有必要)
        });
    },
    handleGlobalClick(e) {
        // 【新增】iOS 音訊解鎖機制
        if (!App.state.isAudioUnlocked) {
            const sound = document.getElementById('ringSound');
            if (sound && sound.paused) {
                sound.volume = 0; // 暫時靜音
                sound.play().then(() => {
                    // 播放成功後立刻暫停並恢復音量
                    sound.pause();
                    sound.currentTime = 0;
                    sound.volume = 1;
                    App.state.isAudioUnlocked = true;
                    console.log("Audio context unlocked for iOS.");
                }).catch(e => {
                    // 如果解鎖失敗 (例如瀏覽器更嚴格的限制)，下次點擊會再試一次
                    console.warn("Audio unlock failed on this attempt.");
                });
            } else if (sound && !sound.paused) {
                // 如果音訊不知為何已在播放，也標記為已解鎖
                App.state.isAudioUnlocked = true;
            }
        }
        const actionTarget = e.target.closest('[data-action]');
        if (actionTarget) {
            const action = actionTarget.dataset.action;
            if (this.actions[action]) {
                this.actions[action](e);
            }
        }
    },

    handleGlobalChange(e) {
        const changeTarget = e.target.closest('[data-change-action]');
        if (changeTarget) {
            const action = changeTarget.dataset.changeAction;
            if (this.changeActions[action]) {
                this.changeActions[action](e);
            }
        }
    },

    // 處理辯士名稱輸入變更
    handleDebaterNameInput(e) {
        const input = e.target;
        if (!input.classList.contains('debater-name-input')) return;

        const team = input.dataset.team;
        const index = parseInt(input.dataset.index, 10);
        const value = input.value.trim();

        if (team === 'positive' && index >= 0 && index < this.state.positiveTeamPlayers.length) {
            this.state.positiveTeamPlayers[index] = value || `正${['一', '二', '三', '四', '五'][index] || (index + 1)}`;
        } else if (team === 'negative' && index >= 0 && index < this.state.negativeTeamPlayers.length) {
            this.state.negativeTeamPlayers[index] = value || `反${['一', '二', '三', '四', '五'][index] || (index + 1)}`;
        }
    },

    // 處理裁判名稱輸入變更
    handleJudgeNameInput(e) {
        const input = e.target;
        if (!input.classList.contains('judge-name-input')) return;

        const index = parseInt(input.dataset.index, 10);
        const value = input.value.trim();

        if (index >= 0 && index < this.state.judges.length) {
            this.state.judges[index] = value || `裁判${['一', '二', '三', '四', '五'][index] || (index + 1)}`;
        }
    },

    handleKeyDown(e) {
        // --- 基本防呆：避免在輸入文字時觸發快捷鍵 ---
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        const isModalOpen = !!document.querySelector('.modal-container');
        if (isModalOpen && e.key !== 'Escape') {
            return;
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            this.actions.undo();
            return;
        }

        // --- [新增] 自由辯論環節的專屬快捷鍵邏輯 ---
        const currentStage = this.state.currentFlow[this.state.currentStageIndex];
        if (currentStage && currentStage.type === 'free_debate' && (e.key === ' ' || e.code === 'Space')) {
            e.preventDefault(); // 防止頁面滾動

            const { freeDebate } = this.state;
            const { activeTeam, isPaused, positiveTimeLeft, negativeTimeLeft } = freeDebate;

            // 判斷是否可以切換 (對方時間 > 0 且計時器未暫停)
            const canSwitch = !isPaused && (
                (activeTeam === 'positive' && negativeTimeLeft > 0) ||
                (activeTeam === 'negative' && positiveTimeLeft > 0) ||
                activeTeam === null // 處理其中一方時間用完後，另一方仍可繼續發言的情況
            );

            if (canSwitch && freeDebate.firstSpeakerSelected) {
                this.switchFreeDebateTeam();
            }

            // 處理完畢後必須 return，避免觸發下方通用的空白鍵「暫停」邏輯
            return;
        }

        // --- 原有的通用快捷鍵邏輯 ---
        const key = e.key.toUpperCase();

        // 一般辯論畫面的快捷鍵
        if (this.state.currentView === 'debate') {
            switch (key) {
                case 'B':
                    document.querySelector('[data-action="previousStage"]:not([disabled])')?.click();
                    break;
                case 'N':
                    document.querySelector('[data-action="nextStage"]:not([disabled])')?.click();
                    break;
                case ' ': // Spacebar
                case 'P':
                    e.preventDefault();
                    // 觸發標準計時器的暫停/繼續
                    document.querySelector('[data-action="togglePause"]')?.click();
                    break;
                case 'M':
                    this.actions.togglePresentationMode();
                    break;
                case 'A':
                    const autoModeToggle = document.querySelector('[data-change-action="toggleAutoMode"]');
                    if (autoModeToggle) {
                        autoModeToggle.checked = !autoModeToggle.checked;
                        autoModeToggle.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    break;
            }
        }

        // 全局快捷鍵
        switch (key) {
            case 'I':
                this.actions.togglePip();
                break;
            case 'R':
                this.actions.resetDebate();
                break;
            case 'F':
                this.actions.toggleFullscreen();
                break;
            case 'T':
                this.actions.toggleTheme();
                break;
            case '?':
            case '/':
                e.preventDefault();
                this.actions.showShortcutHelp();
                break;
            case 'ESCAPE':
                const modal = document.querySelector('.modal-container');
                const sidebar = document.getElementById('sidebar');

                // 優先級 1: 關閉彈出視窗
                if (modal) {
                    modal.remove();
                    return; // 處理完就離開
                }

                // 優先級 2: 關閉側邊欄
                if (!sidebar.classList.contains('hidden')) {
                    this.actions.toggleSidebar();
                    return;
                }

                // 優先級 3: [新增] 退出投影模式 (無論是全螢幕還是視窗版)
                if (App.state.isPresentationMode) {
                    this.actions.toggleFullscreen(); // 呼叫上面的函式來處理退出邏輯
                    return;
                }
                break;;
        }
    },

    // --- ACTIONS ---
    actions: {
        // 賽前設定步驟切換
        goToSetupStep(e) {
            const stepEl = e.target.closest('[data-step]');
            if (!stepEl) return;
            const step = parseInt(stepEl.dataset.step, 10);
            if (step >= 1 && step <= 3) {
                App.state.setupStep = step;
                App.renderSetupView();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        nextSetupStep() {
            // Step 1 驗證：必須選擇賽制
            if (App.state.setupStep === 1) {
                const selectedFormat = App.state.selectedFormat;
                if (!selectedFormat || selectedFormat === 'CUSTOM_EMPTY') {
                    App.showNotification('請先選擇比賽賽制', 'warning');
                    return;
                }
                // 保存 Step 1 的值
                const debateTopicInput = document.getElementById('debateTopicInput');
                if (debateTopicInput) {
                    App.state.debateTopic = debateTopicInput.value.trim() || App.state.debateTopic;
                }
            }
            // 保存 Step 2 的值
            if (App.state.setupStep === 2) {
                App.saveSetupFormValues();
            }
            if (App.state.setupStep < 3) {
                App.state.setupStep++;
                App.renderSetupView();
                // 滾動到頂部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        prevSetupStep() {
            // 保存當前步驟的值
            App.saveSetupFormValues();
            if (App.state.setupStep > 1) {
                App.state.setupStep--;
                App.renderSetupView();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        toggleMicMute() { App.toggleMicMute(); },
        toggleProjectorMode() { App.toggleProjectorMode(); },
        startFreeDebate(e) {
            App.saveState('startFreeDebate');
            const team = e.target.closest('[data-team]').dataset.team;
            App.startFreeDebateTimer(team);
        },
        switchFreeDebate() {
            App.saveState('switchFreeDebate'); // <<-- 新增這一行
            App.switchFreeDebateTeam();
        },
        togglePauseFreeDebate() {
            App.saveState('togglePauseFreeDebate'); // <<-- 新增這一行
            App.togglePauseFreeDebate();
        },
        resetFreeDebateStage() { App.resetFreeDebateStage(); },
        startRecording() { App.startRecording(); },
        stopRecording() { App.stopRecording(); },
        downloadAudio() { App.downloadAudio(); },
        downloadTranscript() { App.downloadTranscript(); },
        async startDebate(e) {
            // [多分頁衝突防護] 一次只能進行一場比賽
            const lockObtained = await App.acquireSpeechLock();
            if (!lockObtained) {
                App.renderModal({
                    title: '無法開始比賽',
                    body: `
                        <div class="text-center space-y-4">
                            <div class="text-5xl">⚠️</div>
                            <p class="text-slate-600 dark:text-slate-300 text-lg font-semibold">
                                一次只能進行一場比賽
                            </p>
                            <p class="text-sm text-slate-500">
                                偵測到另一個分頁正在進行比賽中。請先關閉該分頁的比賽，或在該分頁中繼續操作。
                            </p>
                        </div>
                    `,
                    footer: `<button data-action="returnToHome" class="w-full px-4 py-2 rounded-lg text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-colors font-bold">回到首頁</button>`
                });
                return;
            }

            App.state.history = [];
            App.saveState('startDebate');
            // 優先使用已儲存的賽制名稱，若無則從 DOM 讀取
            const selectedFormatName = App.state.selectedFormat || document.getElementById('formatSelect')?.value;

            if (!selectedFormatName) {
                App.releaseSpeechLock(); // 釋放鎖
                App.showNotification("請選擇一個比賽格式", "error");
                return;
            }

            // --- [新增] 檢查是否選到了空白流程 ---
            if (selectedFormatName === "CUSTOM_EMPTY") {
                App.releaseSpeechLock(); // 釋放鎖
                App.renderModal({
                    title: '尚未設定流程',
                    body: `
                            <div class="text-center space-y-4">
                                <div class="text-5xl">📝</div>
                                <p class="text-slate-600 dark:text-slate-300">
                                    您目前選擇的是「新增空白流程」，裡面還沒有任何比賽階段。
                                </p>
                                <p class="text-sm text-slate-500">
                                    請先點擊左側的 <strong class="text-[var(--color-primary)]">「自定義流程」</strong> 按鈕來新增階段，<br>或者從選單中選擇其他現有的賽制。
                                </p>
                            </div>
                        `,
                    footer: `<button data-action="closeModal" class="w-full px-4 py-2 rounded-lg text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-colors font-bold">我知道了</button>`
                });
                return; // 中斷執行
            }
            // -----------------------------------

            // 檢查是否需要分享畫面音訊，並在需要時進行初始化
            const needsDisplayAudio = App.state.audioSourceModes.positive === 'display' || App.state.audioSourceModes.negative === 'display';
            if (needsDisplayAudio && !App.state.sharedDisplay.isInitialized) {
                App.showNotification("需要擷取線上音訊，請選擇要分享的瀏覽器分頁。", "info", 4000);
                const success = await App.initializeDisplayAudio();
                if (!success) {
                    // 如果使用者取消或擷取失敗，則中止開始辯論的流程
                    return;
                }
            }

            App.state.positiveTeamName = document.getElementById('positiveTeamNameInput')?.value.trim() || App.state.positiveTeamName || "正方";
            App.state.negativeTeamName = document.getElementById('negativeTeamNameInput')?.value.trim() || App.state.negativeTeamName || "反方";
            App.state.debateTopic = document.getElementById('debateTopicInput')?.value.trim() || App.state.debateTopic || "（未設定辯題）";

            // 從辯士名稱設定區塊讀取所有賽制的辯士名稱
            const posDebaterInputs = Array.from(document.querySelectorAll('#positiveDebaterInputs .debater-name-input'));
            const negDebaterInputs = Array.from(document.querySelectorAll('#negativeDebaterInputs .debater-name-input'));

            if (posDebaterInputs.length > 0) {
                App.state.positiveTeamPlayers = posDebaterInputs.map((input, i) =>
                    input.value.trim() || `正${['一', '二', '三', '四', '五'][i] || (i + 1)}`
                );
            }
            if (negDebaterInputs.length > 0) {
                App.state.negativeTeamPlayers = negDebaterInputs.map((input, i) =>
                    input.value.trim() || `反${['一', '二', '三', '四', '五'][i] || (i + 1)}`
                );
            }

            // 從裁判名稱設定區塊讀取裁判名稱（Step 3 進階設定中）
            const judgeInputs = Array.from(document.querySelectorAll('#judgeInputs .judge-name-input'));
            if (judgeInputs.length > 0) {
                App.state.judges = judgeInputs.map((input, i) =>
                    input.value.trim() || `裁判${['一', '二', '三', '四', '五'][i] || (i + 1)}`
                );
            }

            // [ADD START] 行動裝置音訊權限預熱 (Audio Context Warm-up)
            // 在使用者點擊「開始比賽」的瞬間，強制發出極短的無聲音訊並初始化 TTS
            try {
                const sound = document.getElementById('ringSound');
                if (sound) {
                    sound.volume = 0;
                    sound.play().then(() => {
                        sound.pause();
                        sound.currentTime = 0;
                        sound.volume = 1;
                    }).catch(() => { });
                }
                if ('speechSynthesis' in window) {
                    const utterance = new SpeechSynthesisUtterance(' ');
                    utterance.volume = 0;
                    window.speechSynthesis.speak(utterance);
                }
            } catch (e) {
                console.warn("Audio warm-up failed:", e);
            }
            // [ADD END]

            if (selectedFormatName === "辯革盃 (九辯位自由排序制)") {
                // Reset counts for Bian-Ge-Bei
                App.state.positiveActionCounts = { '申論': 0, '質詢': 0, '答辯': 0 };
                App.state.negativeActionCounts = { '申論': 0, '質詢': 0, '答辯': 0 };
                // 辯革盃需要先填入九宮格
                App.state.currentView = 'nineSquare';
            } else {
                const format = App.getDebateFormat(selectedFormatName);
                // 二次檢查：確保載入的流程不是空的 (例如使用者刪光了自訂流程的所有階段)
                if (!format || format.length === 0) {
                    App.showNotification("此流程內容為空，無法開始比賽。", "error");
                    return;
                }
                App.state.currentFlow = JSON.parse(JSON.stringify(format));
                App.state.currentView = 'debate';

                // [CRITICAL FIX] 確保進入比賽畫面就開啟語音辨識（全時段監聽）
                if (App.state.enableSpeechDetection) {
                    // [方案 A] 預先初始化持久 VAD（載入 Silero 模型 + 取得麥克風），之後 grace period 只需激活
                    await App.initPersistentVAD();
                    // 等待音訊管線穩定後再啟動 SpeechRecognition，避免 Chrome 的 aborted 錯誤
                    console.log("Starting continuous SpeechRecognition for the debate.");
                    setTimeout(() => App.startRecognition(), 500);
                }
                // 重置裁判講評順序
                App.state.judgeCommentOrder = [];
                App.state.currentJudge = null;
                App.actions.nextStage(); // Start the first stage
            }
            App.render();
        },
        backToSetup() {
            // [記憶體優化] 清理比賽相關暫存資料
            App.clearDebateMemory();
            App.state.currentView = 'setup';
            App.render();
        },
        addDebater() {
            const count = App.state.positiveTeamPlayers.length;
            if (count >= 4) {
                App.showNotification('最多支援 4 位辯士', 'warning');
                return;
            }
            const num = count + 1;
            const numNames = ['一', '二', '三', '四'];
            App.state.positiveTeamPlayers.push(`正${numNames[count] || num}`);
            App.state.negativeTeamPlayers.push(`反${numNames[count] || num}`);
            App.render();
            App.showNotification(`已新增第 ${num} 位辯士`, 'success');
        },
        removeDebater() {
            if (App.state.positiveTeamPlayers.length <= 3) {
                App.showNotification('至少需要 3 位辯士', 'warning');
                return;
            }
            App.state.positiveTeamPlayers.pop();
            App.state.negativeTeamPlayers.pop();
            App.render();
            App.showNotification(`已移除辯士，目前 ${App.state.positiveTeamPlayers.length} 位`, 'info');
        },
        addJudge() {
            const count = App.state.judges.length;
            if (count >= 5) {
                App.showNotification('最多支援 5 位裁判', 'warning');
                return;
            }
            const num = count + 1;
            const numNames = ['一', '二', '三', '四', '五'];
            App.state.judges.push(`裁判${numNames[count] || num}`);
            App.render();
            App.showNotification(`已新增第 ${num} 位裁判`, 'success');
        },
        removeJudge() {
            if (App.state.judges.length <= 1) {
                App.showNotification('至少需要 1 位裁判', 'warning');
                return;
            }
            App.state.judges.pop();
            App.render();
            App.showNotification(`已移除裁判，目前 ${App.state.judges.length} 位`, 'info');
        },
        toggleFormatDropdown(e) {
            e.preventDefault();
            e.stopPropagation();
            App.toggleFormatDropdown();
        },
        filterFormatByTag(e) {
            const tag = e.target.closest('[data-tag]').dataset.tag;
            App.state.formatFilterTag = tag === '全部' ? null : tag;

            // 更新標籤按鈕樣式
            const tagsContainer = document.getElementById('formatTagsContainer');
            if (tagsContainer) {
                tagsContainer.innerHTML = App.renderFormatTags();
            }

            // 執行篩選並更新下拉選單
            App.filterFormats('', App.state.formatFilterTag);

            // 如果下拉選單是開啟的，重新渲染選項
            const dropdownList = document.getElementById('formatDropdownList');
            if (dropdownList && !dropdownList.classList.contains('hidden')) {
                App.renderFormatDropdownItems('');
            }
        },
        confirmNineSquare() {
            const posGrid = {}, negGrid = {};
            let isValid = true;
            const posCounts = { 'A': 0, 'B': 0, 'C': 0 }, negCounts = { 'A': 0, 'B': 0, 'C': 0 };

            ['positive', 'negative'].forEach(team => {
                for (let round = 1; round <= 3; round++) {
                    for (const type of ['申論', '質詢', '答辯']) {
                        const select = document.getElementById(`${team}-${round}-${type}`);
                        const value = select.value;
                        if (!value) isValid = false;
                        if (team === 'positive') {
                            posGrid[`${round}-${type}`] = value;
                            posCounts[value]++;
                        } else {
                            negGrid[`${round}-${type}`] = value;
                            negCounts[value]++;
                        }
                    }
                }
            });

            if (!isValid) {
                App.showNotification("請完成所有九宮格欄位", "error");
                return;
            }

            let validationError = '';
            ['A', 'B', 'C'].forEach(p => {
                if (posCounts[p] !== 3) validationError += `正方辯士 ${p} 必須負責三項環節。\n`;
                if (negCounts[p] !== 3) validationError += `反方辯士 ${p} 必須負責三項環節。\n`;
            });

            if (validationError) {
                App.showNotification(validationError, "error");
                return;
            }

            App.state.positiveNineSquare = posGrid;
            App.state.negativeNineSquare = negGrid;

            const format = App.getDebateFormat("辯革盃 (九辯位自由排序制)");
            if (!format || format.length === 0) {
                App.showNotification("找不到辯革盃賽制格式", "error");
                return;
            }
            App.state.currentFlow = JSON.parse(JSON.stringify(format));
            App.state.currentView = 'debate';

            // [CRITICAL FIX] 確保進入比賽畫面就開啟語音辨識（全時段監聽）
            if (App.state.enableSpeechDetection) {
                console.log("Starting continuous SpeechRecognition for the debate.");
                App.startRecognition();
            }
            App.render();
            App.actions.nextStage();
        },
        shareFlow() {
            // 先保存設定頁面的表單值
            if (App.state.currentView === 'setup') {
                App.saveSetupFormValues();
            }

            let flowToShare = null;
            let flowName = "自訂流程";

            if (App.state.currentView === 'editor') {
                // 情況一：如果在編輯器中，分享當前正在編輯的流程
                flowToShare = App.state.currentFlow;
                flowName = document.getElementById('editor-flow-name')?.value || '編輯中的流程';
            } else if (App.state.currentView === 'setup') {
                // 情況二：如果在設定頁面，優先使用已儲存的賽制名稱
                flowName = App.state.selectedFormat || document.getElementById('formatSelect')?.value;

                if (!flowName || flowName === "CUSTOM_EMPTY") {
                    App.showNotification("請先選擇要分享的流程", "info");
                    return;
                }

                flowToShare = App.getDebateFormat(flowName);
            }

            if (!flowToShare || flowToShare.length === 0) {
                App.showNotification("沒有可分享的流程內容", "error");
                return;
            }

            try {
                const flowString = JSON.stringify(flowToShare);
                const compressed = pako.deflate(flowString);
                const binaryString = String.fromCharCode.apply(null, new Uint8Array(compressed));
                const encodedData = btoa(binaryString);

                // --- [修改] 統一使用剪貼簿 ---
                navigator.clipboard.writeText(encodedData).then(() => {
                    App.renderModal({
                        title: '分享碼已複製',
                        body: `
                                <p class="text-slate-600 dark:text-slate-300 mb-2">
                                    您分享的流程: <strong class="text-[var(--color-accent)]">${flowName}</strong>
                                </p>
                                <p class="text-slate-600 dark:text-slate-300 mb-4">
                                    我們已將「分享碼」複製到您的剪貼簿。請將這串文字碼貼給您的朋友。
                                </p>
                                <p class="text-sm text-slate-500">
                                    對方需要在「辯時計」的設定頁面點擊「匯入流程」按鈕，並貼上此分享碼。
                                </p>
                            `,
                        footer: `<button data-action="closeModal" class="px-4 py-2 rounded-lg text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">我瞭解了</button>`
                    });
                }).catch(err => {
                    App.showNotification("複製分享碼失敗", "error");
                });
                // --- [結束修改] ---

            } catch (e) {
                console.error("Error generating share code:", e);
                App.showNotification("產生分享資料時發生錯誤", "error");
            }
        },

        copyShareUrl() {
            const input = document.getElementById('shareUrlInput');
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(input.value)
                    .then(() => App.showNotification("連結已複製！", "success"))
                    .catch(err => App.showNotification("複製失敗", "error"));
            } else {
                input.select();
                document.execCommand('copy');
                App.showNotification("連結已複製！", "success");
            }
        },
        undo() { App.restoreState(); },
        nextStage() {
            const currentStage = App.state.currentFlow[App.state.currentStageIndex];

            // --- [新增] 強制檢查：若處於抽籤階段且尚未產生結果，禁止下一步 ---
            if (currentStage && currentStage.type === 'draw_rebuttal_order' && !App.state.rebuttalOrder) {
                App.showNotification("請先進行結辯順序抽籤或指定", "warning");
                // 搖晃提示 (可選視覺效果)
                const drawCard = document.querySelector('.hero-timer-card');
                if (drawCard) {
                    drawCard.classList.add('animate-bounce');
                    setTimeout(() => drawCard.classList.remove('animate-bounce'), 500);
                }
                return;
            }
            // -------------------------------------------------------

            // 如果正在播報抽籤結果時手動點擊，必須強制取消語音
            if (currentStage && currentStage.type === 'draw_rebuttal_order') {
                if (window.speechSynthesis && App.state.isSpeaking) {
                    window.speechSynthesis.cancel();
                }
                App.state.speechQueue = [];
                App.state.isSpeaking = false;
            }

            if (App.state.isAdvancingStage) return;
            App.saveState('nextStage');
            App.state.isAdvancingStage = true;

            App.clearAllTimers();
            // [全局語音控制] 不再停止語音辨識，讓它在整場比賽中持續運作
            // App.stopRecognition(); // REMOVED

            if (App.state.currentStageIndex < App.state.currentFlow.length - 1) {
                App.state.currentStageIndex++;
                App.playSound('stageAdvanceSound');
                App.loadStage(App.state.currentStageIndex);
            } else {
                App.showNotification("所有流程已結束", "info");
                if (App.state.recording.isRecording) {
                    App.stopRecording();
                } else {
                    App.renderEndDebateDownloads();
                }
                App.state.isAdvancingStage = false;
                return;
            }

            setTimeout(() => {
                App.state.isAdvancingStage = false;
            }, 500);
        },
        goToStage(e) {
            // 跳轉到指定階段（點擊流程追蹤器時使用）
            const actionTarget = e.target.closest('[data-action="goToStage"]');
            if (!actionTarget) return;

            const targetIndex = parseInt(actionTarget.dataset.stage, 10);
            if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= App.state.currentFlow.length) return;
            if (targetIndex === App.state.currentStageIndex) return;

            // 檢查計時器是否正在運行
            const isRunning = !!(App.state.timer.interval || App.state.timer.graceInterval);
            if (isRunning && !App.state.timer.isPaused) {
                App.showNotification("請先暫停計時器再跳轉階段", "warning");
                return;
            }

            if (App.state.isAdvancingStage) return;
            App.saveState('goToStage');
            App.state.isAdvancingStage = true;

            App.clearAllTimers();
            // [全局語音控制] 不停止語音辨識

            // 清除抽籤結果（如果跳轉到抽籤階段之前）
            const hasDrawStageInPast = App.state.currentFlow.slice(0, targetIndex + 1).some(s => s.type === 'draw_rebuttal_order');
            if (!hasDrawStageInPast) {
                App.state.rebuttalOrder = null;
            }

            // [BUG FIX] 當跳轉到較早的階段時，回退跳過的 choice_speech 階段的計數
            if (targetIndex < App.state.currentStageIndex) {
                for (let i = App.state.currentStageIndex; i > targetIndex; i--) {
                    const stageToUndo = App.state.currentFlow[i];
                    if (stageToUndo && stageToUndo.type === 'choice_speech' && stageToUndo.executedAction) {
                        const team = stageToUndo.choosingTeam;
                        const actionToUndo = stageToUndo.executedAction;
                        const counts = (team === 'positive') ? App.state.positiveActionCounts : App.state.negativeActionCounts;
                        if (counts[actionToUndo] > 0) {
                            counts[actionToUndo]--;
                        }
                        delete stageToUndo.executedAction;
                    }
                }
            }

            App.state.currentStageIndex = targetIndex;
            App.playSound('stageAdvanceSound');
            App.loadStage(targetIndex);

            setTimeout(() => {
                App.state.isAdvancingStage = false;
            }, 500);
        },
        previousStage() {
            if (App.state.isAdvancingStage) return;
            App.saveState('previousStage');
            if (App.state.currentStageIndex <= 0) return;

            App.state.isAdvancingStage = true;

            App.clearAllTimers();
            // [全局語音控制] 不停止語音辨識

            // 檢查並撤銷目前階段的動作計數
            const stageToUndo = App.state.currentFlow[App.state.currentStageIndex];
            if (stageToUndo && stageToUndo.type === 'choice_speech' && stageToUndo.executedAction) {
                const team = stageToUndo.choosingTeam;
                const actionToUndo = stageToUndo.executedAction;

                const counts = (team === 'positive') ? App.state.positiveActionCounts : App.state.negativeActionCounts;

                if (counts[actionToUndo] > 0) {
                    counts[actionToUndo]--;
                }

                // 清除已執行的動作紀錄，以便重新選擇
                delete stageToUndo.executedAction;
            }

            App.state.currentStageIndex--;

            // 如果返回到抽籤階段之前，則清除抽籤結果
            const hasDrawStageOccurred = App.state.currentFlow.slice(0, App.state.currentStageIndex + 1).some(s => s.type === 'draw_rebuttal_order');
            if (!hasDrawStageOccurred) {
                App.state.rebuttalOrder = null;
            }

            App.loadStage(App.state.currentStageIndex);

            setTimeout(() => {
                App.state.isAdvancingStage = false;
            }, 500);
        },
        togglePause() {
            App.saveState('togglePause');
            App.state.timer.isPaused = !App.state.timer.isPaused;
            if (App.state.timer.isPaused) {
                if (App.state.timer.type === 'grace') clearInterval(App.state.timer.graceInterval);
                else clearInterval(App.state.timer.interval);
                // [FIX] Removed App.stopRecognition() so emergency keywords can still be heard while paused
                // [NEW] 同步暫停系統語音朗讀
                if (window.speechSynthesis && window.speechSynthesis.speaking) {
                    window.speechSynthesis.pause();
                    if (App.state.speechWatchdog) {
                        clearTimeout(App.state.speechWatchdog);
                        App.state.speechWatchdog = null;
                    }
                }
            } else {
                // [FIX] 時間已到時不重新啟動 interval，避免重複觸發時間到邏輯
                if (App.state.timer.timeLeft > 0) {
                    if (App.state.timer.type === 'grace') {
                        App.startRecognition();
                        App.state.timer.graceInterval = setInterval(App.runTimerInterval, 1000);
                    } else if (App.state.timer.type) {
                        App.state.timer.interval = setInterval(App.runTimerInterval, 1000);
                    }
                }
                // [NEW] 恢復系統語音朗讀
                if (window.speechSynthesis && window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
                }
            }
            // 同步投影模式狀態
            if (App.state.projector.isActive) {
                App.sendProjectorUpdate();
            }
            App.renderDebateControls(); // Re-render controls to update button text
        },
        resetDebate() {
            App.renderModal({
                title: '確認重設',
                body: '<p class="text-slate-600 dark:text-slate-300">您確定要重設整個辯論計時器嗎？所有目前的進度將會遺失，且無法復原。</p>',
                footer: `
                        <button data-action="closeModal" class="btn-secondary px-4 py-2 rounded-lg transition-colors">取消</button>
                        <button data-action="confirmReset" class="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors">確定重設</button>
                    `
            });
        },
        confirmReset() {
            if (App.state.recording.isRecording) App.stopRecording();
            window.location.reload();
        },
        returnToHome() {
            if (App.state.currentView === 'debate' || App.state.currentView === 'editor') {
                App.renderModal({
                    title: '確認返回首頁',
                    body: '<p class="text-slate-600 dark:text-slate-300">您確定要返回首頁嗎？目前的比賽或編輯進度將會遺失。</p>',
                    footer: `
                            <button data-action="closeModal" class="btn-secondary px-4 py-2 rounded-lg transition-colors">取消</button>
                            <button data-action="confirmReturnToHome" class="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors">確定返回</button>
                        `
                });
            } else {
                window.location.reload();
            }
        },
        confirmReturnToHome() {
            if (App.state.recording.isRecording) App.stopRecording();
            window.location.reload();
        },
        openEditor() {
            // 先保存設定頁面的表單值
            App.saveSetupFormValues();

            // 優先使用已保存在 state 中的賽制，再從 DOM 取得
            const selectedFormatName = App.state.selectedFormat || document.getElementById('formatSelect')?.value;

            if (selectedFormatName === "CUSTOM_EMPTY" || !selectedFormatName) {
                App.state.currentFlow = [];
            } else {
                const format = App.getDebateFormat(selectedFormatName);
                App.state.currentFlow = JSON.parse(JSON.stringify(format || []));
            }
            App.state.originalFlowBeforeEdit = JSON.parse(JSON.stringify(App.state.currentFlow));
            App.state.currentView = 'editor';
            App.render();
        },
        closeEditor() {
            App.renderModal({
                title: '確認取消編輯',
                body: '<p class="text-slate-600 dark:text-slate-300">您確定要取消編輯嗎？所有未儲存的變更將會遺失。</p>',
                footer: `
                        <button data-action="closeModal" class="btn-secondary px-4 py-2 rounded-lg transition-colors">繼續編輯</button>
                        <button data-action="confirmCloseEditor" class="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors">確定取消</button>
                    `
            });
        },
        confirmCloseEditor(e) {
            App.actions.closeModal(e);
            App.state.currentView = 'setup';
            App.render();
        },
        saveAndCloseEditor() {
            let baseName = document.getElementById('editor-flow-name').value || '自訂流程';
            const newFlowName = `${baseName} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
            if (!App.debateFormatGroups['自訂流程']) {
                App.debateFormatGroups['自訂流程'] = {};
            }
            App.debateFormatGroups['自訂流程'][newFlowName] = JSON.parse(JSON.stringify(App.state.currentFlow));

            // --- [新增] 永久儲存自訂流程 ---
            try {
                localStorage.setItem('customDebateFlows', JSON.stringify(App.debateFormatGroups['自訂流程']));
            } catch (e) {
                console.error("Failed to save custom flows to localStorage:", e);
                App.showNotification("儲存自訂流程失敗", "error");
            }
            // --- [結束] ---

            // 更新選擇的賽制為新儲存的流程
            App.state.selectedFormat = newFlowName;

            App.state.currentView = 'setup';
            App.render();
            // After render, set the new value
            setTimeout(() => {
                const formatSelect = document.getElementById('formatSelect');
                if (formatSelect) {
                    formatSelect.value = newFlowName;
                    // 觸發 formatChanged 以更新 UI
                    const event = new Event('change', { bubbles: true });
                    formatSelect.dispatchEvent(event);
                }
                App.showNotification(`流程 "${newFlowName}" 已儲存`, "success");
            }, 0);
        },

        switchEditorFlow(e) {
            const selectedValue = e.target.value;

            // 檢查是否有未儲存的變更
            if (App.hasUnsavedEditorChanges()) {
                App.state.pendingSwitchFlow = selectedValue;
                App.renderModal({
                    title: '⚠️ 尚有未儲存的變更',
                    body: `
                            <div class="text-center py-4">
                                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <svg class="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <p class="text-slate-600 dark:text-slate-300 text-lg font-medium mb-2">您有未儲存的流程變更</p>
                                <p class="text-slate-500 text-sm">切換到其他流程將會遺失目前的編輯內容。</p>
                            </div>
                        `,
                    footer: `
                            <button data-action="cancelSwitchFlow" class="btn-secondary px-4 py-2 rounded-lg transition-colors">繼續編輯</button>
                            <button data-action="confirmSwitchFlow" class="px-4 py-2 rounded-lg text-white bg-amber-500 hover:bg-amber-600 transition-colors">放棄變更並切換</button>
                        `
                });
            } else {
                App.doSwitchEditorFlow(selectedValue);
            }
        },
        cancelSwitchFlow(e) {
            // 還原選擇器到原本的值
            const originalFormatName = App.findFormatNameByFlow(App.state.originalFlowBeforeEdit) || 'CUSTOM_EMPTY';
            const selector = document.getElementById('editor-flow-selector');
            if (selector) selector.value = originalFormatName;
            App.state.pendingSwitchFlow = null;
            App.actions.closeModal(e);
        },
        confirmSwitchFlow(e) {
            const targetFlow = App.state.pendingSwitchFlow;
            App.state.pendingSwitchFlow = null;
            App.actions.closeModal(e);
            App.doSwitchEditorFlow(targetFlow);
        },

        addStage() {
            App.renderStageEditorModal();
        },
        editStage(e) {
            const index = parseInt(e.target.closest('[data-index]').dataset.index, 10);
            App.renderStageEditorModal(App.state.currentFlow[index], index);
        },
        deleteStage(e) {
            const index = parseInt(e.target.closest('[data-index]').dataset.index, 10);
            if (confirm(`確定要刪除階段 "${App.state.currentFlow[index].name}" 嗎？`)) {
                App.state.currentFlow.splice(index, 1);
                App.renderEditorStageList();
            }
        },
        saveStage(e) {
            const form = e.target.closest('.modal-container').querySelector('form');
            const formData = new FormData(form);
            const index = parseInt(formData.get('index'), 10);

            const stageData = {
                name: formData.get('name'),
                type: formData.get('type'),
                duration: parseInt(formData.get('duration'), 10) || null,
                script: formData.get('script'),
                timerLabel: formData.get('timerLabel'),
                graceDuration: parseInt(formData.get('graceDuration'), 10) || null,
                graceEndAction: formData.get('graceEndAction'),
                choosingTeam: formData.get('choosingTeam'),
                actionChoices: formData.get('actionChoices') ? formData.get('actionChoices').split(',').map(s => s.trim()) : [],
                baseScript: formData.get('baseScript'),
                baseTimerLabel: formData.get('baseTimerLabel'),
            };

            if (isNaN(index)) { // new stage
                App.state.currentFlow.push(stageData);
            } else { // editing existing
                App.state.currentFlow[index] = stageData;
            }

            App.renderEditorStageList();
            App.actions.closeModal(e);
        },
        startDraw() {
            App.playSound('drawSound');
            const team = Math.random() < 0.5 ? 'positive' : 'negative';
            App.finalizeRebuttalOrder(team);
        },
        manualSetRebuttalOrder(e) {
            const team = e.target.closest('[data-team]').dataset.team;
            App.playSound('stageAdvanceSound'); // 使用一個不同的音效以區分操作
            App.finalizeRebuttalOrder(team);
        },
        manualStartTimer() {
            App.saveState('manualStartTimer');
            const stage = App.state.currentFlow[App.state.currentStageIndex];
            if (stage && stage.type === "manual_prep") App.startManualPrepTimer(stage.duration);
        },
        forceStartMainTimer() {
            App.saveState('forceStartMainTimer');
            const stage = App.state.currentFlow[App.state.currentStageIndex];
            if (stage && App.state.timer.type === 'grace') {
                clearInterval(App.state.timer.graceInterval);
                // [FIX] Removed App.stopRecognition() to allow continuous listening
                App.startMainSpeechTimer(stage.duration);
            }
        },
        confirmStageChoice(e) {
            const selectedAction = e.target.closest('[data-choice]').dataset.choice;
            const { stage, resolve } = App.state.currentChoice;

            if (stage && resolve) {
                const team = stage.choosingTeam;
                // Increment the count for the selected action
                // [FIX] 確保 key 存在於 actionCounts 中，避免 Unicode 編碼差異問題
                const actionCounts = (team === 'positive') ? App.state.positiveActionCounts : App.state.negativeActionCounts;
                if (typeof actionCounts[selectedAction] !== 'number') {
                    actionCounts[selectedAction] = 0;
                }
                actionCounts[selectedAction]++;

                // [FIXED] Store the executed choice for potential reversal.
                const currentStageInFlow = App.state.currentFlow[App.state.currentStageIndex];
                if (currentStageInFlow) {
                    currentStageInFlow.executedAction = selectedAction;
                }

                // 根據九宮格決定上場辯士
                let selectedPlayer = "辯士";
                const nineSquare = (team === 'positive') ? App.state.positiveNineSquare : App.state.negativeNineSquare;
                // actionCounts 已在上方宣告，不需重複宣告
                const players = (team === 'positive') ? App.state.positiveTeamPlayers : App.state.negativeTeamPlayers;

                // 如果有九宮格資料，則根據九宮格決定辯士
                if (nineSquare && Object.keys(nineSquare).length > 0) {
                    // 決定是第幾輪（根據該動作類型已選擇的次數）
                    const round = actionCounts[selectedAction]; // 這輪是第幾次選這個動作

                    if (selectedAction === '申論') {
                        // 申論：使用九宮格中對應輪次的「申論」欄位
                        const playerKey = nineSquare[`${round}-申論`];
                        if (playerKey) {
                            const playerIndex = playerKey.charCodeAt(0) - 65; // A=0, B=1, C=2
                            selectedPlayer = players[playerIndex] || `辯士 ${playerKey}`;
                        }
                    } else if (selectedAction === '質答') {
                        // 質答：使用九宮格中對應輪次的「質詢」和「答辯」欄位
                        const questionerKey = nineSquare[`${round}-質詢`];
                        const responderKey = nineSquare[`${round}-答辯`];
                        if (questionerKey && responderKey) {
                            const qIndex = questionerKey.charCodeAt(0) - 65;
                            const rIndex = responderKey.charCodeAt(0) - 65;
                            const questioner = players[qIndex] || `辯士 ${questionerKey}`;
                            const responder = players[rIndex] || `辯士 ${responderKey}`;
                            selectedPlayer = `${questioner} 質詢 / ${responder} 答辯`;
                        }
                    }
                }

                // Update UI with the selected player and action
                const stageContainer = document.getElementById('stageContainer');
                if (stageContainer) {
                    stageContainer.innerHTML = `
                             <div class="glass-card p-6 rounded-2xl shadow-lg">
                                 <h3 class="font-bold text-xl mb-2">${App.interpolateScript(stage.name)}</h3>
                                 <p class="text-slate-600 dark:text-slate-300">${App.interpolateScript(stage.baseScript, { selected_player: selectedPlayer, selected_action_type: selectedAction })}</p>
                             </div>
                         `;
                }
                const timerStatus = document.getElementById('timerStatus');
                if (timerStatus) {
                    timerStatus.textContent = App.interpolateScript(stage.baseTimerLabel, { selected_player: selectedPlayer, selected_action_type: selectedAction });
                }

                App.actions.closeModal(e);

                // Resolve the promise to continue the process
                resolve({ selected_player: selectedPlayer, selected_action_type: selectedAction });
            }
            App.state.currentChoice = { stage: null, resolve: null };
        },
        confirmJudgeChoice(e) {
            const judgeIndex = parseInt(e.target.closest('[data-judge-index]').dataset.judgeIndex, 10);
            const { stage, resolve } = App.state.currentJudgeChoice;

            if (stage && resolve) {
                const judges = App.state.judges || ['裁判一', '裁判二', '裁判三'];
                const selectedJudge = judges[judgeIndex] || `裁判${judgeIndex + 1}`;
                const totalJudges = judges.length;
                const isFirstJudge = App.state.judgeCommentOrder.length === 0;

                // 記錄講評順序
                if (!App.state.judgeCommentOrder) {
                    App.state.judgeCommentOrder = [];
                }
                App.state.judgeCommentOrder.push(judgeIndex);

                const commentedCount = App.state.judgeCommentOrder.length;
                const isLastJudge = commentedCount === totalJudges;

                // 記錄當前選擇的裁判，供後續使用
                App.state.currentJudge = {
                    index: judgeIndex,
                    name: selectedJudge
                };

                // 生成講稿
                let scriptToSpeak = '';
                let displayScript = '';

                if (isFirstJudge) {
                    // 第一位裁判：包含開場白
                    scriptToSpeak = `感謝雙方隊伍帶來一場精彩的比賽，接下來讓我們欣賞更精彩的裁判講評。首先，歡迎 ${selectedJudge} 前輩為我們講評。`;
                    displayScript = `首先，歡迎 ${selectedJudge} 前輩為我們講評。`;
                } else if (isLastJudge) {
                    // 最後一位裁判
                    scriptToSpeak = `最後，歡迎 ${selectedJudge} 前輩為我們講評。`;
                    displayScript = scriptToSpeak;
                } else {
                    // 中間的裁判
                    scriptToSpeak = `接著，歡迎 ${selectedJudge} 前輩為我們講評。`;
                    displayScript = scriptToSpeak;
                }

                // 更新階段顯示 - 讓 renderDebateStage 處理
                // stageContainer 會在 speakCallback 中的 renderDebateControls 之後由 state 更新

                const timerStatus = document.getElementById('timerStatus');
                if (timerStatus) {
                    timerStatus.textContent = `${selectedJudge} 講評中`;
                }

                App.actions.closeModal(e);

                // Resolve the promise to continue the process
                // 講稿會在 loadStage 中統一朗讀
                resolve({ selected_judge: selectedJudge, judge_index: judgeIndex, script: scriptToSpeak, displayScript: displayScript });
            }
            App.state.currentJudgeChoice = { stage: null, resolve: null };
        },
        resetJudgeCommentOrder(e) {
            App.state.judgeCommentOrder = [];
            App.state.currentJudge = null;
            App.showNotification('已重置裁判講評順序', 'info');

            // 重新顯示選擇對話框
            if (App.state.currentJudgeChoice && App.state.currentJudgeChoice.stage) {
                App.actions.closeModal(e);
                setTimeout(() => {
                    App.getJudgeChoice(App.state.currentJudgeChoice.stage)
                        .then(App.state.currentJudgeChoice.resolve)
                        .catch(App.state.currentJudgeChoice.reject);
                }, 100);
            }
        },
        finishJudgeComment() {
            // 結束當前裁判講評，選擇下一位裁判或完成
            const judges = App.state.judges || ['裁判一', '裁判二', '裁判三'];
            const commentedCount = (App.state.judgeCommentOrder || []).length;

            // 清除當前裁判
            App.state.currentJudge = null;

            if (commentedCount >= judges.length) {
                // 所有裁判已講評完畢
                App.showNotification('所有裁判講評完畢！', 'success');

                // 如果是自動模式，延遲後自動跳到下一階段
                if (App.state.isAutoMode) {
                    App.state.autoAdvanceTimeout = setTimeout(() => {
                        App.actions.nextStage();
                    }, 2000);
                } else {
                    App.renderDebateStage();
                }
            } else {
                // 還有裁判未講評，顯示選擇對話框
                const stage = App.state.currentFlow[App.state.currentStageIndex];
                if (stage && stage.type === 'judge_comment') {
                    App.getJudgeChoice(stage).then((choiceResult) => {
                        // 朗讀講稿並重新渲染
                        if (choiceResult && choiceResult.script) {
                            App.speak(choiceResult.script, () => {
                                App.renderDebateStage();
                            });
                        } else {
                            App.renderDebateStage();
                        }
                    }).catch((e) => {
                        console.error("Judge choice cancelled", e);
                        App.renderDebateStage();
                    });
                }
            }
        },
        startTranscription() {
            if (App.state.speechRecognitionStatus !== 'ready' && App.state.speechRecognitionStatus !== 'active') {
                App.showNotification("語音辨識功能不受支援或發生錯誤", "error");
                return;
            }
            App.state.transcription.active = true;
            App.state.transcription.paused = false;
            App.state.transcription.currentParagraphId = null;
            App.startRecognition();
            App.renderTranscriptionPanel();
        },
        pauseTranscription() {
            if (App.recognition && App.state.transcription.active && !App.state.transcription.paused) {
                App.state.transcription.paused = true;
                // [全局語音控制] 轉錄暫停不影響辨識，onend 會檢查 transcription.paused 並仍然重啟
                App.renderTranscriptionPanel();
            }
        },
        resumeTranscription() {
            if (App.recognition && App.state.transcription.active && App.state.transcription.paused) {
                App.state.transcription.paused = false;
                App.startRecognition();
                App.renderTranscriptionPanel();
            }
        },
        stopTranscription() {
            if (App.recognition && App.state.transcription.active) {
                App.state.transcription.active = false;
                App.state.transcription.paused = false;
                // [全局語音控制] 轉錄停止不影響辨識，onend 會檢查 enableSpeechDetection 並仍然重啟
                App.renderTranscriptionPanel();
            }
        },
        pauseRecording() {
            App.pauseRecording();
        },
        resumeRecording() {
            App.resumeRecording();
        },
        // 錄音播放器 actions
        openRecordingPlayer() {
            if (!App.state.recording.audioBlob) {
                App.showNotification("沒有可播放的錄音", "info");
                return;
            }
            App.state.recording.isPlayerOpen = true;
            App.renderRecordingPlayer();
        },
        closeRecordingPlayer() {
            App.state.recording.isPlayerOpen = false;
            const playerPanel = document.getElementById('recordingPlayerPanel');
            if (playerPanel) playerPanel.remove();
        },
        seekToTimestamp(e) {
            const index = parseInt(e.target.closest('[data-timestamp-index]')?.dataset.timestampIndex, 10);
            if (isNaN(index)) return;
            App.seekToRecordingTimestamp(index);
        },
        seekToEndScreenTimestamp(e) {
            const index = parseInt(e.target.closest('[data-timestamp-index]')?.dataset.timestampIndex, 10);
            if (isNaN(index)) return;
            App.seekToEndScreenTimestamp(index);
        },
        seekToMultiRecording(e) {
            const btn = e.target.closest('[data-rec-index]');
            const recIndex = parseInt(btn?.dataset.recIndex, 10);
            const tsIndex = parseInt(btn?.dataset.timestampIndex, 10);
            if (isNaN(recIndex) || isNaN(tsIndex)) return;
            App.seekToMultiRecording(recIndex, tsIndex);
        },
        downloadSingleRecording(e) {
            const recIndex = parseInt(e.target.closest('[data-rec-index]')?.dataset.recIndex, 10);
            if (isNaN(recIndex)) return;
            App.downloadSingleRecording(recIndex);
        },
        downloadAllRecordings() {
            App.downloadAllRecordings();
        },
        shareSingleRecording(e) {
            const recIndex = parseInt(e.target.closest('[data-rec-index]')?.dataset.recIndex, 10);
            if (isNaN(recIndex)) return;
            App.shareSingleRecording(recIndex);
        },
        copyTimestamps(e) {
            const recIndex = parseInt(e.target.closest('[data-rec-index]')?.dataset.recIndex, 10);
            if (isNaN(recIndex)) return;
            App.copyTimestamps(recIndex);
        },
        toggleTheme() {
            const html = document.documentElement;
            const isDark = html.classList.contains('dark');

            // 切換主題
            if (isDark) {
                html.classList.remove('dark');
                html.classList.add('light');
                localStorage.setItem('debateTimerTheme', 'light');
            } else {
                html.classList.add('dark');
                html.classList.remove('light');
                localStorage.setItem('debateTimerTheme', 'dark');
            }

            // 更新頂部 Header 的圖示
            App.renderHeader();

            // [關鍵修正] 重新渲染側邊選單，讓文字從「深色」變成「淺色」
            App.renderSidebar();

            // 如果有開啟畫中畫，也要更新畫布顏色
            if (App.state.pip.isActive) {
                App.renderPipCanvas();
            }

            // 移除並重新建立 Portal 元素以套用新主題
            const portal = document.getElementById('formatDropdownListPortal');
            if (portal) {
                portal.remove();
            }
        },
        toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('hidden');
        },
        toggleFullscreen() {
            // 判斷目前是否處於比賽進行中 (辯論或自由辯論)
            const isDebateActive = App.state.currentView === 'debate' || App.state.currentView === 'free_debate';
            const body = document.body;

            // 邏輯更新：如果已經是全螢幕 OR 已經有投影模式樣式，則執行「退出」
            if (document.fullscreenElement || body.classList.contains('presentation-mode')) {

                // 1. 嘗試退出瀏覽器全螢幕 (如果有的話)
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(err => console.log("Exit fullscreen handled silently"));
                }

                // 2. 強制移除樣式與狀態 (處理視窗模式的情況)
                body.classList.remove('presentation-mode');
                App.state.isPresentationMode = false;

                // 3. 恢復 UI 控制列
                if (App.state.currentView === 'debate') App.renderDebateControls();
                if (App.state.currentView === 'free_debate') App.renderFreeDebateControls();
                App.renderHeader(); // 確保標題列回來

                App.showNotification("已退出投影模式", "info");
                return;
            }

            // --- 進入全螢幕邏輯 ---
            // 先嘗試請求瀏覽器原生全螢幕
            document.documentElement.requestFullscreen().then(() => {
                // [成功] 瀏覽器進入全螢幕
                if (isDebateActive) {
                    body.classList.add('presentation-mode');
                    App.state.isPresentationMode = true;
                    if (App.state.pip.isActive) App.renderPipCanvas();
                    App.showNotification("已進入投影模式 (按 Esc 退出)", "success");
                } else {
                    App.showNotification("已進入全螢幕", "success");
                }
            }).catch(err => {
                // [失敗/被拒絕] 瀏覽器無法全螢幕 (例如 iOS Safari 或權限不足)
                console.warn("Fullscreen API denied, falling back to Windowed Mode.", err);

                // ★★★ 關鍵修改：即使失敗，只要在比賽中，依然強制開啟投影介面 ★★★
                if (isDebateActive) {
                    body.classList.add('presentation-mode');
                    App.state.isPresentationMode = true;
                    if (App.state.pip.isActive) App.renderPipCanvas();

                    // 這裡特別提示是用視窗模式
                    App.showNotification("已進入投影模式 (視窗版)", "success");
                } else {
                    App.showNotification("您的裝置不支援全螢幕", "warning");
                }
            });
        },

        // 保留此函式但將其導向 toggleFullscreen，以相容快捷鍵 'M'
        togglePresentationMode() {
            this.toggleFullscreen();
        },

        async togglePip() {
            if (!App.pipCanvas) {
                App.showNotification("畫中畫畫布不存在", "error");
                return;
            }
            if (!('pictureInPictureEnabled' in document) || !document.pictureInPictureEnabled) {
                App.showNotification("您的瀏覽器不支援畫中畫功能", "error");
                return;
            }

            try {
                if (document.pictureInPictureElement) {
                    await document.exitPictureInPicture();
                } else {
                    App.renderPipCanvas();
                    const video = document.createElement('video');
                    video.muted = true;
                    video.playsInline = true;
                    video.srcObject = App.pipCanvas.captureStream();
                    App.state.pip.videoElement = video;

                    video.onleavepictureinpicture = () => {
                        App.state.pip.isActive = false;
                        if (video.srcObject) {
                            video.srcObject.getTracks().forEach(track => track.stop());
                        }
                        App.state.pip.videoElement = null;

                        // [FIX START] 根據當前階段類型呼叫對應的 controls 渲染函式
                        const currentStage = App.state.currentFlow[App.state.currentStageIndex];
                        if (currentStage && currentStage.type === 'free_debate') {
                            App.renderFreeDebateControls();
                        } else {
                            App.renderDebateControls();
                        }
                        // [FIX END]
                    };

                    await video.play();
                    const pipWindow = await video.requestPictureInPicture();
                    App.state.pip.isActive = true;
                    pipWindow.addEventListener('resize', () => App.renderPipCanvas());

                    // [FIX START] 根據當前階段類型呼叫對應的 controls 渲染函式
                    const currentStage = App.state.currentFlow[App.state.currentStageIndex];
                    if (currentStage && currentStage.type === 'free_debate') {
                        App.renderFreeDebateControls();
                    } else {
                        App.renderDebateControls();
                    }
                    // [FIX END]
                }
            } catch (error) {
                console.error("PiP toggle error:", error);
                App.showNotification(`畫中畫操作失敗: ${error.message}`, "error");
                if (App.state.pip.videoElement && App.state.pip.videoElement.srcObject) {
                    App.state.pip.videoElement.srcObject.getTracks().forEach(track => track.stop());
                }
                App.state.pip.isActive = false;
                App.state.pip.videoElement = null;
            }
        },
        showShortcutHelp() {
            const shortcuts = [
                { key: 'B', desc: '上一階段' },
                { key: 'N', desc: '下一階段' },
                { key: 'Space / P', desc: '暫停 / 繼續計時' },
                { key: 'A', desc: '切換自動模式' },
                { key: 'I', desc: '切換畫中畫模式' },
                { key: 'R', desc: '重設辯論' },
                { key: 'F', desc: '切換全螢幕' },
                { key: 'T', desc: '切換亮/暗主題' },
                { key: 'M', desc: '切換投影模式' },
                { key: 'Esc', desc: '關閉彈出視窗或側邊欄' },
                { key: 'ctrl+z', desc: '復原' },
                { key: '? 或 /', desc: '顯示快捷鍵說明' },
            ];

            const body = `
                    <div class="space-y-4">
                    ${shortcuts.map(s => `
                            <div class="flex items-center justify-between p-2 rounded-md shortcut-item">
                            <span class="font-semibold">${s.desc}</span>
                            <kbd class="px-2 py-1 text-sm font-semibold text-gray-800 bg-gray-200 border border-gray-300 rounded-md dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">${s.key}</kbd>
                        </div>
                        `).join('')}
                    </div>
                `;

            App.renderModal({
                title: '快捷鍵說明',
                body: body,
                footer: `<button data-action="closeModal" class="btn-secondary px-4 py-2 rounded-lg">關閉</button>`
            });
        },
        restartTour() {
            App.restartTour();
        },
        startTour() {
            App.startTour();
        },
        showPremiumModal() {
            App.showNotification("開發中，敬請期待。 歡迎洽談開發團隊", "info", 5000);
        },
        closeModal(e) {
            const modal = e.target.closest('.modal-container');
            if (modal) modal.remove();
        },


        deleteCustomFlow(e) {
            const flowName = App.state.selectedFormat;
            if (!flowName) {
                App.showNotification("請先選擇一個賽制", "warning");
                return;
            }

            // 檢查這是否為一個可刪除的「自訂流程」
            if (!App.debateFormatGroups['自訂流程'] || !App.debateFormatGroups['自訂流程'][flowName]) {
                App.showNotification("無法刪除: 這不是您儲存的自訂流程。", "info");
                return;
            }

            // 顯示確認彈窗
            App.renderModal({
                title: '確認刪除',
                body: `<p class="text-slate-600 dark:text-slate-300">您確定要永久刪除自訂流程 "${flowName}" 嗎？<br><strong class="text-red-500">此操作無法復原。</strong></p>`,
                footer: `
                        <button data-action="closeModal" class="btn-secondary px-4 py-2 rounded-lg transition-colors">取消</button>
                        <button data-action="confirmDeleteCustomFlow" class="px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors">確定刪除</button>
                    `
            });
        },

        confirmDeleteCustomFlow(e) {
            const flowName = App.state.selectedFormat;
            if (!flowName) {
                App.actions.closeModal(e);
                return;
            }

            if (App.debateFormatGroups['自訂流程'] && App.debateFormatGroups['自訂流程'][flowName]) {
                // 1. 從物件中刪除
                delete App.debateFormatGroups['自訂流程'][flowName];

                // 2. 將更新後的物件存回 localStorage
                try {
                    localStorage.setItem('customDebateFlows', JSON.stringify(App.debateFormatGroups['自訂流程']));
                    App.showNotification(`流程 "${flowName}" 已成功刪除。`, "success");
                } catch (err) {
                    console.error("Failed to update localStorage after deletion:", err);
                    App.showNotification("刪除時發生錯誤", "error");
                }

                // 3. 清空選擇狀態並重新渲染
                App.state.selectedFormat = null;
                App.state.currentFlow = [];
                App.actions.closeModal(e);
                App.render(); // 這將會呼叫 renderSetupView 並更新下拉選單

            } else {
                App.showNotification("找不到要刪除的流程。", "error");
                App.actions.closeModal(e);
            }
        },
        showFormatSelectorModal() {
            // 保存設定頁面的表單值
            App.saveSetupFormValues();

            // 建立分類標籤
            const groupNames = Object.keys(App.debateFormatGroups);
            const tagsHtml = `
                        <button data-action="filterFormatGroup" data-group="全部" class="format-tag active">全部</button>
                        ${groupNames.map(group => `
                            <button data-action="filterFormatGroup" data-group="${group}" class="format-tag">${group}</button>
                        `).join('')}
                    `;

            // 建立分組賽制列表
            let formatsHtml = '';
            const groupIcons = {
                '特殊賽制': '🟠',
                '新式奧瑞岡（臺灣）': '🔵',
                '新式奧瑞岡（國際）': '🟣',
                '新加坡制': '🟢',
                '自訂流程': '⭐'
            };

            for (const [groupName, formats] of Object.entries(App.debateFormatGroups)) {
                const formatKeys = Object.keys(formats);
                if (formatKeys.length === 0) continue;

                const icon = groupIcons[groupName] || '📋';
                formatsHtml += `
                            <div class="format-group" data-group="${groupName}">
                                <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 px-3 py-2 bg-slate-100 dark:bg-slate-800/50 sticky top-0">${icon} ${groupName}</div>
                                ${formatKeys.map(formatName => `
                                    <button data-action="selectFormatFromModal" data-format="${formatName}" class="format-option w-full text-left px-4 py-3 hover:bg-[var(--color-primary)]/10 transition-colors flex items-center gap-3 border-b border-[var(--border-color)]/50">
                                        <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 flex items-center justify-center text-sm">${icon}</span>
                                        <span class="font-medium text-[var(--text-main)]">${formatName}</span>
                                    </button>
                                `).join('')}
                            </div>
                        `;
            }

            const modalBody = `
                        <div class="space-y-4">
                            <!-- 分類標籤 -->
                            <div id="modalFormatTags" class="flex flex-wrap gap-2">
                                ${tagsHtml}
                            </div>
                            
                            <!-- 搜尋框 -->
                            <div class="relative">
                                <input type="text" id="modalFormatSearch" 
                                    class="modern-input pl-10 pr-4 w-full text-sm" 
                                    placeholder="搜尋賽制..."
                                    autocomplete="off">
                                <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                            </div>
                            
                            <!-- 賽制列表 -->
                            <div id="modalFormatList" class="rounded-xl border border-[var(--border-color)]">
                                ${formatsHtml}
                            </div>
                        </div>
                    `;

            App.renderModal({
                title: '🏆 選擇比賽賽制',
                body: modalBody,
                footer: ''
            });

            // 綁定搜尋和篩選事件
            setTimeout(() => {
                const searchInput = document.getElementById('modalFormatSearch');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        App.filterModalFormats(e.target.value.toLowerCase());
                    });
                    searchInput.focus();
                }
            }, 100);
        },

        filterFormatGroup(e) {
            const group = e.target.dataset.group;

            // 更新標籤狀態
            document.querySelectorAll('#modalFormatTags .format-tag').forEach(tag => {
                tag.classList.toggle('active', tag.dataset.group === group);
            });

            // 篩選列表
            document.querySelectorAll('#modalFormatList .format-group').forEach(groupEl => {
                if (group === '全部') {
                    groupEl.style.display = 'block';
                } else {
                    groupEl.style.display = groupEl.dataset.group === group ? 'block' : 'none';
                }
            });
        },

        selectFormatFromModal(e) {
            const formatName = e.target.closest('[data-format]')?.dataset.format;
            if (!formatName) return;

            // 更新選擇的賽制
            App.state.selectedFormat = formatName;

            // 找到對應的流程並設定
            for (const [groupName, formats] of Object.entries(App.debateFormatGroups)) {
                if (formats[formatName]) {
                    App.state.currentFlow = JSON.parse(JSON.stringify(formats[formatName]));
                    break;
                }
            }

            // 更新隱藏的 select 值
            const formatSelect = document.getElementById('formatSelect');
            if (formatSelect) {
                formatSelect.value = formatName;
                const event = new Event('change', { bubbles: true });
                formatSelect.dispatchEvent(event);
            }

            // 關閉 Modal
            App.actions.closeModal(e);

            // 重新渲染設定頁面以更新顯示
            App.renderSetupView();

            App.showNotification(`已選擇賽制：${formatName}`, 'success');
        },

        showImportModal() {
            // 先保存設定頁面的表單值
            App.saveSetupFormValues();

            App.renderModal({
                title: '匯入流程',
                body: `
                        <p class="text-slate-600 dark:text-slate-300 mb-4">請在下方貼上您收到的「流程分享碼」。</p>
                        <textarea id="import-flow-textarea" class="form-element w-full h-32 font-mono text-xs" placeholder="在此貼上分享碼..."></textarea>
                    `,
                footer: `
                        <button data-action="closeModal" class="btn-secondary px-4 py-2 rounded-lg">取消</button>
                        <button data-action="importFromText" class="px-4 py-2 rounded-lg text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">匯入</button>
                    `
            });
        },

        importFromText(e) {
            const textarea = document.getElementById('import-flow-textarea');
            if (!textarea) return;

            const encodedData = textarea.value.trim();
            if (!encodedData) {
                App.showNotification("沒有內容", "info");
                return;
            }

            const flowName = App.decodeFlow(encodedData);

            if (flowName) {
                // 更新 state 中的選擇
                App.state.selectedFormat = flowName;
                App.showNotification(`已成功匯入 "${flowName}"`, "success");
                App.actions.closeModal(e); // 關閉匯入彈窗
                App.render(); // 重新渲染設定頁面

                // 延遲一點點，確保 DOM 更新完畢
                setTimeout(() => {
                    const formatSelect = document.getElementById('formatSelect');
                    if (formatSelect) {
                        formatSelect.value = flowName; // 自動選中剛匯入的流程
                        // 手動觸發 change 事件，來更新按鈕狀態
                        formatSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, 0);
            } else {
                App.showNotification("匯入失敗：分享碼無效或已損毀。", "error");
            }
        },
        toggleAutoMode() {
            App.state.isAutoMode = !App.state.isAutoMode; // 直接反轉狀態
            localStorage.setItem('debateAutoMode', App.state.isAutoMode);
            App.renderDebateControls(); // 重新渲染以更新按鈕顏色
            App.showNotification(App.state.isAutoMode ? "已開啟自動模式" : "已關閉自動模式", "info");
        },

        toggleSpeech() {
            App.state.enableSpeech = !App.state.enableSpeech; // 直接反轉狀態
            localStorage.setItem('debateSpeech', App.state.enableSpeech);

            if (!App.state.enableSpeech && App.synth && App.synth.speaking) {
                App.synth.cancel();
            }
            App.renderDebateControls(); // 重新渲染以更新按鈕顏色
            App.showNotification(App.state.enableSpeech ? "已開啟語音朗讀" : "已關閉語音朗讀", "info");
        },
    },

    changeActions: {
        setTeamAudioSource(e) {
            const team = e.target.dataset.team;
            const mode = e.target.value;
            if (team && (mode === 'microphone' || mode === 'display')) {
                App.state.audioSourceModes[team] = mode;
                localStorage.setItem('debateAudioSourceModes', JSON.stringify(App.state.audioSourceModes));
                const teamName = team === 'positive' ? '正方' : '反方';
                const modeName = mode === 'microphone' ? '實體麥克風' : '線上音訊';
                App.showNotification(`${teamName} 偵測來源已設為: ${modeName}`, 'success');
            }
        },
        toggleAutoMode(e) {
            App.state.isAutoMode = e.target.checked;
            localStorage.setItem('debateAutoMode', App.state.isAutoMode);
            // Also update the control panel if it's visible
            if (App.state.currentView === 'debate') {
                const controlToggle = document.querySelector('#debateControlsContainer [data-change-action="toggleAutoMode"]');
                if (controlToggle) controlToggle.checked = App.state.isAutoMode;
            }
        },
        toggleSpeechDetection(e) {
            App.state.enableSpeechDetection = e.target.checked;
            localStorage.setItem('debateSpeechDetection', App.state.enableSpeechDetection);
        },
        setGraceDuration(e) {
            const duration = parseInt(e.target.value, 10);
            if (!isNaN(duration) && duration >= 0) {
                App.state.customGraceDuration = duration;
                localStorage.setItem('debateGraceDuration', duration);
                App.showNotification(`準備時間已設定為 ${duration} 秒`, 'success');
            }
        },
        formatChanged(e) {
            const selectedValue = e.target.value;
            // 儲存選擇的賽制名稱到 state（排除空白流程選項）
            if (selectedValue && selectedValue !== 'CUSTOM_EMPTY') {
                App.state.selectedFormat = selectedValue;
            }
            const isBianGeBei = selectedValue === '辯革盃 (九辯位自由排序制)';

            // 更新：分別選取兩個隊伍卡片中的選手輸入區塊
            const playerGroups = document.querySelectorAll('.player-input-group');
            playerGroups.forEach(group => {
                group.style.display = isBianGeBei ? 'block' : 'none';
                // 加入一點動畫效果
                if (isBianGeBei) {
                    group.classList.add('animate-fade-in-up');
                }
            });

            const isCustomFlow = App.debateFormatGroups['自訂流程'] && App.debateFormatGroups['自訂流程'][selectedValue];
            const deleteBtn = document.querySelector('[data-action="deleteCustomFlow"]');

            if (deleteBtn) {
                deleteBtn.disabled = !isCustomFlow;
                deleteBtn.classList.toggle('opacity-30', !isCustomFlow);
                deleteBtn.classList.toggle('cursor-not-allowed', !isCustomFlow);
            }

            // 更新賽制流程預覽
            const previewContainer = document.getElementById('formatPreview');
            if (previewContainer) {
                const flow = App.getDebateFormat(selectedValue);
                const MAX_PREVIEW_STAGES = 5; // 預覽顯示的最大階段數
                if (flow && flow.length > 0) {
                    const previewStages = flow.slice(0, MAX_PREVIEW_STAGES);
                    const stageNames = previewStages.map(s => {
                        const name = s.name || '';
                        // 簡化階段名稱，只取關鍵字
                        if (name.includes('申論')) return '申論';
                        if (name.includes('質詢') || name.includes('質答')) return '質詢';
                        if (name.includes('結辯')) return '結辯';
                        if (name.includes('自由辯') || name.includes('對辯')) return '自由辯';
                        if (name.includes('抽籤')) return '抽籤';
                        if (name.includes('準備')) return '準備';
                        return name.replace(/正方|反方/g, '').trim().slice(0, 4);
                    }).filter(n => n);

                    let previewHTML = stageNames.map(name =>
                        `<span class="format-preview-tag">${name}</span>`
                    ).join('<span class="format-preview-arrow">→</span>');

                    if (flow.length > MAX_PREVIEW_STAGES) {
                        previewHTML += `<span class="format-preview-tag">...共${flow.length}階段</span>`;
                    }

                    previewContainer.innerHTML = previewHTML;
                    previewContainer.style.display = 'flex';
                } else {
                    previewContainer.style.display = 'none';
                }
            }
        },
        toggleSpeech(e) {
            App.state.enableSpeech = e.target.checked;
            localStorage.setItem('debateSpeech', App.state.enableSpeech);
            if (!App.state.enableSpeech && App.synth && App.synth.speaking) {
                // 如果使用者是「關閉」朗讀，且當前正在朗讀中
                console.log("Speech canceled by user toggle.");
                App.synth.cancel();
            }

            const allToggles = document.querySelectorAll('[data-change-action="toggleSpeech"]');
            allToggles.forEach(toggle => {
                if (toggle !== e.target) {
                    toggle.checked = App.state.enableSpeech;
                }
            });
        },
        switchEditorFlow(e) {
            App.actions.switchEditorFlow(e);
        },
    },
    // --- RENDERING ---
    render() {
        this.router();
        this.renderHeader();
        this.renderSidebar();
    },

    router() {
        // [記憶體優化] 視圖切換時清理前一視圖的 DOM 快取
        const previousView = this._lastRouterView;

        // 建立一個高階函式來處理視圖切換的淡入淡出
        const switchView = (renderFunction) => {
            // 如果內容已經是透明的，就不要再加 class，直接渲染
            if (this.mainContent.classList.contains('content-fade-out')) {
                renderFunction.call(this);
                this.mainContent.classList.remove('content-fade-out');
                return;
            }

            this.mainContent.classList.add('content-fade-out');
            setTimeout(() => {
                renderFunction.call(this); // 使用 .call(this) 確保函式內的 'this' 指向 App 物件
                // 渲染後移除 class，觸發淡入效果
                this.mainContent.classList.remove('content-fade-out');
            }, 250); // 這個時間需要和 CSS transition 的時間匹配
        };

        const currentStage = this.state.currentFlow[this.state.currentStageIndex];
        let newView = this.state.currentView;

        if (currentStage && currentStage.type === 'free_debate') {
            newView = 'free_debate';
            // [記憶體優化] 離開自由辯論視圖時清理快取
            if (previousView !== 'free_debate') {
                this._cachedTimerEl = null;
                this._cachedProgressEl = null;
            }
            switchView(this.renderFreeDebateView);
            this._lastRouterView = newView;
            return;
        }

        // [記憶體優化] 離開自由辯論時清理其專用快取
        if (previousView === 'free_debate' && newView !== 'free_debate') {
            this._clearFreeDebateCache();
        }

        switch (this.state.currentView) {
            case 'setup':
                switchView(this.renderSetupView);
                break;
            case 'nineSquare':
                switchView(this.renderNineSquareGridView);
                break;
            case 'debate':
                switchView(this.renderDebateView);
                break;
            case 'editor':
                switchView(this.renderEditorView);
                break;
        }

        this._lastRouterView = newView;

        if (this.state.pip.isActive) {
            this.renderPipCanvas();
        }
    },

    // 標籤顏色映射
    formatTagColors: {
        '全部': 'bg-slate-500',
        '特殊賽制': 'bg-purple-500',
        '新式奧瑞岡 (含結辯)': 'bg-blue-500',
        '新式奧瑞岡 (無結辯)': 'bg-cyan-500',
        '自訂流程': 'bg-emerald-500',
        '分享的流程': 'bg-amber-500'
    },

    renderFormatTags() {
        const groups = Object.keys(this.debateFormatGroups).filter(g => {
            const formats = this.debateFormatGroups[g];
            return formats && Object.keys(formats).length > 0;
        });

        const activeTag = this.state.formatFilterTag || '全部';

        let tagsHtml = `<button data-action="filterFormatByTag" data-tag="全部" 
                class="format-tag px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
                ${activeTag === '全部' ? 'bg-slate-500 text-white shadow-md scale-105' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}">
                全部
            </button>`;

        groups.forEach(group => {
            const colorClass = this.formatTagColors[group] || 'bg-indigo-500';
            const isActive = activeTag === group;
            tagsHtml += `<button data-action="filterFormatByTag" data-tag="${group}" 
                    class="format-tag px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer
                    ${isActive ? colorClass + ' text-white shadow-md scale-105' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}">
                    ${group}
                </button>`;
        });

        return tagsHtml;
    },

    filterFormats(searchText, tagFilter) {
        const formatSelect = document.getElementById('formatSelect');
        const filterInfo = document.getElementById('formatFilterInfo');
        const searchInput = document.getElementById('formatSearchInput');
        if (!formatSelect) return;

        const search = (searchText || '').toLowerCase().trim();
        const tag = tagFilter || '全部';
        let visibleCount = 0;
        let totalCount = 0;
        let firstVisibleOption = null;

        // 遍歷所有 optgroup 和 option
        Array.from(formatSelect.querySelectorAll('optgroup')).forEach(optgroup => {
            const groupLabel = optgroup.label;
            const matchesTag = tag === '全部' || this.formatMatchesTag(groupLabel, tag);
            let groupHasVisible = false;

            Array.from(optgroup.querySelectorAll('option')).forEach(option => {
                totalCount++;
                const optionText = option.textContent.toLowerCase();
                const matchesSearch = !search || optionText.includes(search);
                const shouldShow = matchesTag && matchesSearch;

                option.style.display = shouldShow ? '' : 'none';
                option.disabled = !shouldShow;

                if (shouldShow) {
                    visibleCount++;
                    groupHasVisible = true;
                    if (!firstVisibleOption && option.value !== 'CUSTOM_EMPTY') {
                        firstVisibleOption = option;
                    }
                }
            });

            // 隱藏空的 optgroup
            optgroup.style.display = groupHasVisible ? '' : 'none';
        });

        // 顯示篩選資訊
        if (filterInfo) {
            if (search || tag !== '全部') {
                filterInfo.style.display = 'block';
                filterInfo.textContent = `顯示 ${visibleCount} / ${totalCount} 個賽制`;
            } else {
                filterInfo.style.display = 'none';
            }
        }

        // 如果當前選中的選項被隱藏了，自動選擇第一個可見選項
        const currentOption = formatSelect.options[formatSelect.selectedIndex];
        if (currentOption && currentOption.style.display === 'none' && firstVisibleOption) {
            formatSelect.value = firstVisibleOption.value;
            formatSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 同步更新下拉選單
        this.renderFormatDropdownItems(search);
        this.updateFormatSearchDisplay();
    },

    filterModalFormats(searchTerm) {
        const formatList = document.getElementById('modalFormatList');
        if (!formatList) return;

        const options = formatList.querySelectorAll('.format-option');
        const groups = formatList.querySelectorAll('.format-group');

        options.forEach(option => {
            const formatName = option.dataset.format?.toLowerCase() || '';
            option.style.display = formatName.includes(searchTerm) ? 'flex' : 'none';
        });

        // 隱藏沒有可見選項的分組
        groups.forEach(group => {
            const visibleOptions = group.querySelectorAll('.format-option[style*="flex"], .format-option:not([style*="none"])');
            const hasVisible = Array.from(group.querySelectorAll('.format-option')).some(opt => opt.style.display !== 'none');
            group.style.display = hasVisible ? 'block' : 'none';
        });
    },

    initFormatSearch() {
        const searchInput = document.getElementById('formatSearchInput');
        const formatSelect = document.getElementById('formatSelect');

        if (!searchInput || !formatSelect) return;

        // 初始化顯示當前選中的值
        this.updateFormatSearchDisplay();

        // 點擊輸入框時顯示下拉選單 (但不會重複觸發)
        searchInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!this.isFormatDropdownOpen()) {
                this.showFormatDropdown();
            }
        });

        // 輸入搜尋時過濾選項
        searchInput.addEventListener('input', (e) => {
            if (!this.isFormatDropdownOpen()) {
                this.showFormatDropdown();
            }
            this.renderFormatDropdownItems(e.target.value);
        });

        // 點擊外部時關閉下拉選單
        document.addEventListener('click', (e) => {
            const container = document.getElementById('formatDropdownContainer');
            const portal = document.getElementById('formatDropdownListPortal');
            const arrow = document.getElementById('formatDropdownArrow');

            // 如果點擊的是箭頭，讓 action 處理
            if (arrow && arrow.contains(e.target)) return;

            // 如果點擊在容器或 portal 內部，不關閉
            if (container && container.contains(e.target)) return;
            if (portal && portal.contains(e.target)) return;

            this.hideFormatDropdown();
        });

        // 鍵盤導航
        searchInput.addEventListener('keydown', (e) => {
            const dropdownList = document.getElementById('formatDropdownListPortal');
            if (e.key === 'Escape') {
                this.hideFormatDropdown();
                searchInput.blur();
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateFormatDropdown(e.key === 'ArrowDown' ? 1 : -1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const highlighted = dropdownList?.querySelector('.searchable-dropdown-item.highlighted');
                if (highlighted) {
                    highlighted.click();
                }
            }
        });
    },

    // 檢查下拉選單是否開啟
    isFormatDropdownOpen() {
        const dropdownList = document.getElementById('formatDropdownListPortal');
        return dropdownList && dropdownList.style.display === 'block';
    },

    // 切換下拉選單
    toggleFormatDropdown() {
        if (this.isFormatDropdownOpen()) {
            this.hideFormatDropdown();
        } else {
            this.showFormatDropdown();
        }
    },

    showFormatDropdown() {
        const dropdownArrow = document.getElementById('formatDropdownArrow');
        const searchInput = document.getElementById('formatSearchInput');
        const container = document.getElementById('formatDropdownContainer');

        if (!dropdownArrow || !container || !searchInput) return;

        // 移除舊的下拉選單（如果存在）
        let dropdownList = document.getElementById('formatDropdownListPortal');
        if (!dropdownList) {
            // 創建下拉選單到 body - 使用 fixed 定位避免被父容器裁切
            dropdownList = document.createElement('div');
            dropdownList.id = 'formatDropdownListPortal';
            // [行動裝置修復] 不在 class 中設定固定 max-h，改由 CSS 響應式控制
            dropdownList.className = 'searchable-dropdown-list glass-dropdown py-2 rounded-xl overflow-y-auto';
            // z-index 55: 高於 sticky-action-bar(50)，低於 header(60)
            // [行動裝置修復] 動態計算最大高度
            const isMobileDevice = window.innerWidth < 768;
            const maxHeight = isMobileDevice ? 'min(50vh, calc(100vh - 200px))' : '18rem';
            dropdownList.style.cssText = `position: fixed; z-index: 55; display: none; max-height: ${maxHeight};`;
            document.body.appendChild(dropdownList);
        }

        // 計算位置 - 緊貼搜尋框底部
        const updatePosition = () => {
            const rect = searchInput.getBoundingClientRect();
            const isMobileDevice = window.innerWidth < 768;

            // [行動裝置修復] 確保選單不會超出螢幕底部
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const minBottomPadding = isMobileDevice ? 120 : 80; // 為底部按鈕列留空間

            // 計算可用高度
            const availableHeight = spaceBelow - minBottomPadding;
            const maxAllowedHeight = isMobileDevice ? Math.min(availableHeight, viewportHeight * 0.5) : Math.min(availableHeight, 288);

            dropdownList.style.top = rect.bottom + 'px';
            dropdownList.style.left = rect.left + 'px';
            dropdownList.style.width = rect.width + 'px';
            dropdownList.style.maxHeight = Math.max(maxAllowedHeight, 150) + 'px'; // 最小高度 150px
        };

        updatePosition();
        dropdownList.style.display = 'block';

        // 滾動時關閉選單（但排除選單本身的滾動）- 所有裝置統一行為
        const closeOnScroll = (e) => {
            // 如果是在選單內部滾動，不關閉
            if (dropdownList.contains(e.target)) return;
            this.hideFormatDropdown();
        };

        // 所有裝置：滾動時關閉選單
        dropdownList._scrollHandler = closeOnScroll;
        window.addEventListener('scroll', closeOnScroll, { passive: true, capture: true });
        // 監聽 touchmove 事件，確保觸控滑動時能正確關閉選單
        dropdownList._touchMoveHandler = closeOnScroll;
        document.addEventListener('touchmove', closeOnScroll, { passive: true });

        // 視窗大小變化時更新位置
        const throttledUpdate = () => {
            if (dropdownList._rafPending) return;
            dropdownList._rafPending = true;
            requestAnimationFrame(() => {
                updatePosition();
                dropdownList._rafPending = false;
            });
        };
        dropdownList._resizeHandler = throttledUpdate;
        window.addEventListener('resize', throttledUpdate, { passive: true });

        dropdownArrow.classList.add('open');
        searchInput.value = '';
        searchInput.placeholder = '輸入關鍵字搜尋...';
        this.renderFormatDropdownItems('');
    },

    hideFormatDropdown() {
        const dropdownList = document.getElementById('formatDropdownListPortal');
        const dropdownArrow = document.getElementById('formatDropdownArrow');

        if (dropdownList) {
            dropdownList.style.display = 'none';
            // [效能優化] 移除事件監聽器
            if (dropdownList._scrollHandler) {
                window.removeEventListener('scroll', dropdownList._scrollHandler, { passive: true, capture: true });
                dropdownList._scrollHandler = null;
            }
            if (dropdownList._resizeHandler) {
                window.removeEventListener('resize', dropdownList._resizeHandler, { passive: true });
                dropdownList._resizeHandler = null;
            }
            // [iOS 修復] 移除 touchmove 事件監聽器
            if (dropdownList._touchMoveHandler) {
                document.removeEventListener('touchmove', dropdownList._touchMoveHandler, { passive: true });
                dropdownList._touchMoveHandler = null;
            }
        }
        if (dropdownArrow) {
            dropdownArrow.classList.remove('open');
        }
        this.updateFormatSearchDisplay();
    },

    updateFormatSearchDisplay() {
        const searchInput = document.getElementById('formatSearchInput');
        const formatSelect = document.getElementById('formatSelect');

        if (searchInput && formatSelect) {
            const selectedText = formatSelect.options[formatSelect.selectedIndex]?.text || '';
            // 將選中的值直接顯示在 value 中，而不是 placeholder
            searchInput.value = selectedText;
            searchInput.placeholder = '點擊選擇或搜尋賽制...';
        }
    },

    renderFormatDropdownItems(searchTerm = '') {
        const dropdownList = document.getElementById('formatDropdownListPortal');
        const formatSelect = document.getElementById('formatSelect');

        if (!dropdownList || !formatSelect) return;

        const searchLower = searchTerm.toLowerCase().trim();
        const currentValue = formatSelect.value;
        const tagFilter = this.state.formatFilterTag;

        // 定義圖示類型
        const getIconClass = (groupName, formatName) => {
            if (groupName === '自訂流程' || groupName === '分享的流程') return 'custom';
            if (groupName === '特殊賽制') return 'special';
            if (groupName.includes('新式奧瑞岡')) return 'new-oregon';
            if (groupName.includes('傳統奧瑞岡') || groupName.includes('經典')) return 'classic';
            if (groupName.includes('BP') || groupName.includes('英國')) return 'bp';
            return 'default';
        };

        const getIcon = (groupName, formatName) => {
            if (formatName === 'CUSTOM_EMPTY') return '➕';
            if (groupName === '自訂流程' || groupName === '分享的流程') return '📝';
            if (groupName === '特殊賽制') return '⭐';
            if (groupName.includes('新式奧瑞岡')) return '🔵';
            if (groupName.includes('傳統奧瑞岡')) return '🟢';
            if (groupName.includes('BP') || groupName.includes('英國')) return '🔴';
            return '📋';
        };

        let html = '';
        let hasResults = false;

        // 定義群組順序
        const groupOrder = ['分享的流程', '自訂流程', '特殊賽制'];
        const allGroups = [...groupOrder, ...Object.keys(this.debateFormatGroups).filter(g => !groupOrder.includes(g))];

        for (const groupName of allGroups) {
            const formats = this.debateFormatGroups[groupName];
            if (!formats) continue;

            let groupItems = [];

            // 處理自訂流程群組的「新增空白流程」選項
            if (groupName === '自訂流程') {
                const matchesSearch = !searchLower || '新增空白流程'.includes(searchLower) || 'custom_empty'.includes(searchLower);
                const matchesTag = !tagFilter || tagFilter === '自訂';
                if (matchesSearch && matchesTag) {
                    groupItems.push({
                        value: 'CUSTOM_EMPTY',
                        text: '＋ 新增空白流程',
                        icon: '➕',
                        iconClass: 'custom'
                    });
                }
            }

            for (const formatName in formats) {
                const matchesSearch = !searchLower || formatName.toLowerCase().includes(searchLower);
                const matchesTag = !tagFilter || this.formatMatchesTag(groupName, tagFilter);

                if (matchesSearch && matchesTag) {
                    groupItems.push({
                        value: formatName,
                        text: formatName,
                        icon: getIcon(groupName, formatName),
                        iconClass: getIconClass(groupName, formatName)
                    });
                }
            }

            if (groupItems.length > 0) {
                hasResults = true;
                html += `<div class="searchable-dropdown-group">`;
                html += `<div class="searchable-dropdown-group-label">${groupName}</div>`;
                groupItems.forEach(item => {
                    const isSelected = item.value === currentValue ? 'selected' : '';
                    html += `
                            <div class="searchable-dropdown-item ${isSelected}" data-value="${item.value}">
                                <span class="searchable-dropdown-item-icon ${item.iconClass}">${item.icon}</span>
                                <span class="dropdown-item-text">${item.text}</span>
                            </div>
                        `;
                });
                html += `</div>`;
            }
        }

        if (!hasResults) {
            html = `
                    <div class="searchable-dropdown-empty">
                        <div class="searchable-dropdown-empty-icon">🔍</div>
                        <div class="text-sm font-medium">找不到符合的賽制</div>
                        <div class="text-xs mt-1 opacity-70">試試其他關鍵字或清除篩選</div>
                    </div>
                `;
        }

        dropdownList.innerHTML = html;

        // 綁定點擊事件
        dropdownList.querySelectorAll('.searchable-dropdown-item').forEach(item => {
            item.addEventListener('click', () => {
                const value = item.dataset.value;
                formatSelect.value = value;
                formatSelect.dispatchEvent(new Event('change', { bubbles: true }));
                this.hideFormatDropdown();
            });
        });
    },

    navigateFormatDropdown(direction) {
        const dropdownList = document.getElementById('formatDropdownListPortal');
        if (!dropdownList) return;

        const items = dropdownList.querySelectorAll('.searchable-dropdown-item');
        if (items.length === 0) return;

        const currentHighlighted = dropdownList.querySelector('.searchable-dropdown-item.highlighted');
        let currentIndex = -1;

        if (currentHighlighted) {
            items.forEach((item, i) => {
                if (item === currentHighlighted) currentIndex = i;
            });
            currentHighlighted.classList.remove('highlighted');
        }

        let newIndex = currentIndex + direction;
        if (newIndex < 0) newIndex = items.length - 1;
        if (newIndex >= items.length) newIndex = 0;

        items[newIndex].classList.add('highlighted');
        items[newIndex].scrollIntoView({ block: 'nearest' });
    },

    formatMatchesTag(groupName, tag) {
        // 如果 tag 是 '全部'，則所有群組都匹配
        if (tag === '全部') return true;
        // 直接比較群組名稱與標籤
        return groupName === tag;
    },

    // 保存設定頁面表單值到 state
    saveSetupFormValues() {
        // 盃賽名稱 (Step 1)
        const tournamentNameInput = document.getElementById('tournamentNameInput');
        if (tournamentNameInput) {
            App.state.tournamentName = tournamentNameInput.value.trim();
        }
        // 辯題 (Step 1)
        const debateTopicInput = document.getElementById('debateTopicInput');
        if (debateTopicInput) {
            App.state.debateTopic = debateTopicInput.value.trim() || App.state.debateTopic;
        }
        // 隊伍名稱 (Step 2)
        const positiveTeamNameInput = document.getElementById('positiveTeamNameInput');
        const negativeTeamNameInput = document.getElementById('negativeTeamNameInput');
        if (positiveTeamNameInput) {
            App.state.positiveTeamName = positiveTeamNameInput.value.trim() || App.state.positiveTeamName;
        }
        if (negativeTeamNameInput) {
            App.state.negativeTeamName = negativeTeamNameInput.value.trim() || App.state.negativeTeamName;
        }
        // 辯士名稱 (Step 2) - 只從 debaterNamesSection 區塊中讀取，避免重複
        const debaterSection = document.getElementById('debaterNamesSection');
        if (debaterSection) {
            const posDebaterInputs = Array.from(debaterSection.querySelectorAll('#positiveDebaterInputs .debater-name-input'));
            const negDebaterInputs = Array.from(debaterSection.querySelectorAll('#negativeDebaterInputs .debater-name-input'));
            if (posDebaterInputs.length > 0) {
                App.state.positiveTeamPlayers = posDebaterInputs.map((input, i) =>
                    input.value.trim() || `正${['一', '二', '三', '四'][i] || (i + 1)}`
                );
            }
            if (negDebaterInputs.length > 0) {
                App.state.negativeTeamPlayers = negDebaterInputs.map((input, i) =>
                    input.value.trim() || `反${['一', '二', '三', '四'][i] || (i + 1)}`
                );
            }
        }
        // 裁判名稱 (Step 3)
        const judgeInputs = Array.from(document.querySelectorAll('#judgeInputs .judge-name-input'));
        if (judgeInputs.length > 0) {
            App.state.judges = judgeInputs.map((input, i) =>
                input.value.trim() || App.state.judges[i] || `裁判${['一', '二', '三', '四', '五'][i] || (i + 1)}`
            );
        }
    },

    renderSetupView() {
        try {
            const savedCustomFlows = localStorage.getItem('customDebateFlows');
            if (savedCustomFlows) {
                if (!App.debateFormatGroups['自訂流程']) App.debateFormatGroups['自訂流程'] = {};
                Object.assign(App.debateFormatGroups['自訂流程'], JSON.parse(savedCustomFlows));
            } else if (!App.debateFormatGroups['自訂流程']) {
                App.debateFormatGroups['自訂流程'] = {};
            }
        } catch (e) {
            if (!App.debateFormatGroups['自訂流程']) App.debateFormatGroups['自訂流程'] = {};
        }

        let formatOptions = '';
        if (this.debateFormatGroups['分享的流程']) {
            formatOptions += `<optgroup label="分享的流程">` + Object.keys(this.debateFormatGroups['分享的流程']).map(name => `<option value="${name}">${name}</option>`).join('') + `</optgroup>`;
        }
        formatOptions += `<optgroup label="自訂流程"><option value="CUSTOM_EMPTY">＋ 新增空白流程</option>`;
        if (this.debateFormatGroups['自訂流程']) {
            formatOptions += Object.keys(this.debateFormatGroups['自訂流程']).map(name => `<option value="${name}">${name}</option>`).join('');
        }
        formatOptions += `</optgroup>`;
        for (const groupName in this.debateFormatGroups) {
            if (groupName === '分享的流程' || groupName === '自訂流程') continue;
            const formats = this.debateFormatGroups[groupName];
            if (Object.keys(formats).length > 0) {
                formatOptions += `<optgroup label="${groupName}">` + Object.keys(formats).map(name => `<option value="${name}">${name}</option>`).join('') + `</optgroup>`;
            }
        }

        const speechDetectionChecked = this.state.enableSpeechDetection ? 'checked' : '';
        const currentStep = this.state.setupStep || 1;

        // 進度指示器的樣式函數
        const getStepClass = (step) => {
            if (step < currentStep) return 'bg-green-500 text-white cursor-pointer hover:bg-green-600'; // 已完成
            if (step === currentStep) return 'bg-indigo-500 text-white'; // 當前
            return 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-400'; // 未完成
        };
        const getStepTextClass = (step) => {
            if (step === currentStep) return 'text-indigo-600 dark:text-indigo-400 font-medium';
            return 'text-slate-500';
        };
        const getLineClass = (beforeStep) => {
            return beforeStep < currentStep ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600';
        };

        this.mainContent.innerHTML = `
                <div class="setup-container w-full max-w-4xl mx-auto animate-fade-in-up px-4 md:px-0 pb-32">
                    <!-- 頁面標題 -->
                    <div class="setup-header mb-6 text-center">
                        <h2 class="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">賽前設定</h2>
                    </div>

                    <!-- 進度指示器 (僅顯示) -->
                    <div class="flex items-center justify-center gap-2 mb-8">
                        <div class="flex items-center gap-2 transition-all ${currentStep === 1 ? '' : 'opacity-80'}">
                            <span class="w-8 h-8 rounded-full ${getStepClass(1)} flex items-center justify-center text-sm font-bold transition-colors">
                                ${1 < currentStep ? '✓' : '1'}
                            </span>
                            <span class="text-sm ${getStepTextClass(1)} hidden sm:inline">辯題與賽制</span>
                        </div>
                        <div class="w-6 sm:w-10 h-0.5 ${getLineClass(1)} transition-colors"></div>
                        <div class="flex items-center gap-2 transition-all ${currentStep === 2 ? '' : 'opacity-80'}">
                            <span class="w-8 h-8 rounded-full ${getStepClass(2)} flex items-center justify-center text-sm font-bold transition-colors">
                                ${2 < currentStep ? '✓' : '2'}
                            </span>
                            <span class="text-sm ${getStepTextClass(2)} hidden sm:inline">隊伍資訊</span>
                        </div>
                        <div class="w-6 sm:w-10 h-0.5 ${getLineClass(2)} transition-colors"></div>
                        <div class="flex items-center gap-2 transition-all ${currentStep === 3 ? '' : 'opacity-80'}">
                            <span class="w-8 h-8 rounded-full ${getStepClass(3)} flex items-center justify-center text-sm font-bold transition-colors">3</span>
                            <span class="text-sm ${getStepTextClass(3)} hidden sm:inline">確認開始</span>
                        </div>
                    </div>

                    <div class="space-y-6">
                        <!-- Step 1：辯題與賽制 -->
                        ${currentStep === 1 ? `
                        <div class="glass-panel p-6 md:p-8 relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                            <div class="flex items-center gap-3 mb-6">
                                <span class="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500">
                                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </span>
                                <div>
                                    <h3 class="text-lg font-bold text-[var(--text-main)]">Step 1：辯題與賽制</h3>
                                    <p class="text-xs text-slate-500">設定本場比賽的核心議題與進行方式</p>
                                </div>
                            </div>
                            
                            <div class="space-y-6">
                                <!-- 盃賽名稱輸入 -->
                                <div>
                                    <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                                        盃賽名稱 <span class="text-xs text-slate-400 font-normal">(選填)</span>
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="tournamentNameInput" class="modern-input text-base pr-10" placeholder="例如：大辯盃辯論比賽" value="${this.state.tournamentName || ''}">
                                        <button type="button" id="clearTournamentBtn" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" title="清除">
                                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- 辯題輸入 -->
                                <div>
                                    <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                        辯題
                                    </label>
                                    <div class="relative">
                                        <input type="text" id="debateTopicInput" class="modern-input text-lg font-bold pr-10" placeholder="輸入今日辯題，例如：大學生應強制服兵役" value="${this.state.debateTopic}">
                                        <button type="button" id="clearTopicBtn" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" title="清除">
                                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- 賽制選擇 -->
                                <div>
                                    <label class="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                        <svg class="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        比賽賽制
                                    </label>
                                    
                                    <!-- 選擇賽制按鈕 -->
                                    <div class="flex gap-2">
                                        <button data-action="showFormatSelectorModal" class="flex-grow modern-input text-left flex items-center justify-between gap-3 hover:border-[var(--color-primary)] transition-colors group">
                                            <div class="flex items-center gap-3">
                                                <span class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center text-lg">🏆</span>
                                                <div class="text-left">
                                                    <div id="selectedFormatName" class="font-semibold text-[var(--text-main)] ${this.state.selectedFormat ? '' : 'text-slate-400'}">${this.state.selectedFormat || '點擊選擇賽制...'}</div>
                                                    <div class="text-xs text-slate-500">點擊選擇或更換比賽賽制</div>
                                                </div>
                                            </div>
                                            <svg class="w-5 h-5 text-slate-400 group-hover:text-[var(--color-primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                        <button data-action="deleteCustomFlow" title="刪除自訂流程" class="flex-shrink-0 w-12 self-stretch rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
                                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                    
                                    <!-- 隱藏的原生 select 用於保持相容性 -->
                                    <select id="formatSelect-step1" data-change-action="formatChanged" class="hidden">
                                        ${formatOptions}
                                    </select>
                                    
                                    <div id="formatPreview" class="format-preview mt-3" style="display: none;"></div>
                                </div>
                            </div>
                        </div>
                        ` : ''}

                        <!-- Step 2：隊伍資訊 -->
                        ${currentStep === 2 ? `
                        <div class="glass-panel p-6 md:p-8 relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-red-500"></div>
                            <div class="flex items-center gap-3 mb-6">
                                <span class="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-red-500/20 text-emerald-500">
                                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                </span>
                                <div>
                                    <h3 class="text-lg font-bold text-[var(--text-main)]">Step 2：隊伍資訊</h3>
                                    <p class="text-xs text-slate-500">設定正反方隊伍名稱與辯士</p>
                                </div>
                            </div>
                            
                        <!-- 隊伍名稱 -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <!-- 正方 -->
                            <div class="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center text-sm font-bold">正</span>
                                    <span class="font-bold text-green-700 dark:text-green-400">正方隊伍</span>
                                </div>
                                <input type="text" id="positiveTeamNameInput" class="modern-input font-semibold text-green-700 dark:text-green-400 border-green-300 dark:border-green-700" value="${this.state.positiveTeamName}" placeholder="輸入正方隊名">
                                <!-- 語音偵測來源 -->
                                <div class="mt-3">
                                    <label for="positiveAudioSource" class="text-xs font-medium text-green-600 dark:text-green-400 mb-1 block">語音偵測來源</label>
                                    <select id="positiveAudioSource" data-change-action="setTeamAudioSource" data-team="positive" class="modern-input text-sm border-green-300 dark:border-green-700">
                                        <option value="microphone" ${this.state.audioSourceModes.positive === 'microphone' ? 'selected' : ''}>實體麥克風</option>
                                        <option value="display" ${this.state.audioSourceModes.positive === 'display' ? 'selected' : ''}>線上音訊 (網頁分頁)</option>
                                    </select>
                                </div>
                            </div>
                            <!-- 反方 -->
                            <div class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <div class="flex items-center gap-2 mb-3">
                                    <span class="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center text-sm font-bold">反</span>
                                    <span class="font-bold text-red-700 dark:text-red-400">反方隊伍</span>
                                </div>
                                <input type="text" id="negativeTeamNameInput" class="modern-input font-semibold text-red-700 dark:text-red-400 border-red-300 dark:border-red-700" value="${this.state.negativeTeamName}" placeholder="輸入反方隊名">
                                <!-- 語音偵測來源 -->
                                <div class="mt-3">
                                    <label for="negativeAudioSource" class="text-xs font-medium text-red-600 dark:text-red-400 mb-1 block">語音偵測來源</label>
                                    <select id="negativeAudioSource" data-change-action="setTeamAudioSource" data-team="negative" class="modern-input text-sm border-red-300 dark:border-red-700">
                                        <option value="microphone" ${this.state.audioSourceModes.negative === 'microphone' ? 'selected' : ''}>實體麥克風</option>
                                        <option value="display" ${this.state.audioSourceModes.negative === 'display' ? 'selected' : ''}>線上音訊 (網頁分頁)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 辯士名稱 -->
                        <div class="border-t border-[var(--border-color)] pt-6">
                            <h4 class="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                辯士名稱設定
                                <span class="text-xs text-slate-400 font-normal ml-2">（勾選結辯者）</span>
                            </h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- 正方辯士 -->
                                <div>
                                    <div class="text-xs font-medium text-green-600 dark:text-green-400 mb-2">正方辯士</div>
                                    <div id="positiveDebaterInputs" class="space-y-2">
                                        ${this.state.positiveTeamPlayers.map((p, i) => `
                                            <div class="flex items-center gap-2">
                                                <input type="text" 
                                                    class="debater-name-input modern-input text-sm flex-1 border-green-200 dark:border-green-800" 
                                                    data-team="positive" 
                                                    data-index="${i}"
                                                    placeholder="正方辯士 ${i + 1}" 
                                                    value="${p}">
                                                <label class="flex items-center gap-1 cursor-pointer select-none" title="設為結辯">
                                                    <input type="radio" 
                                                        name="positiveClosing" 
                                                        class="closing-radio w-4 h-4 text-green-600 accent-green-600" 
                                                        data-team="positive" 
                                                        data-index="${i}"
                                                        ${this.state.positiveClosingIndex === i ? 'checked' : ''}>
                                                    <span class="text-xs text-green-600 dark:text-green-400 font-medium">結</span>
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                                <!-- 反方辯士 -->
                                <div>
                                    <div class="text-xs font-medium text-red-600 dark:text-red-400 mb-2">反方辯士</div>
                                    <div id="negativeDebaterInputs" class="space-y-2">
                                        ${this.state.negativeTeamPlayers.map((p, i) => `
                                            <div class="flex items-center gap-2">
                                                <input type="text" 
                                                    class="debater-name-input modern-input text-sm flex-1 border-red-200 dark:border-red-800" 
                                                    data-team="negative" 
                                                    data-index="${i}"
                                                    placeholder="反方辯士 ${i + 1}" 
                                                    value="${p}">
                                                <label class="flex items-center gap-1 cursor-pointer select-none" title="設為結辯">
                                                    <input type="radio" 
                                                        name="negativeClosing" 
                                                        class="closing-radio w-4 h-4 text-red-600 accent-red-600" 
                                                        data-team="negative" 
                                                        data-index="${i}"
                                                        ${this.state.negativeClosingIndex === i ? 'checked' : ''}>
                                                    <span class="text-xs text-red-600 dark:text-red-400 font-medium">結</span>
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                            <!-- 新增/移除辯士按鈕 -->
                            <div class="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-[var(--border-color)]">
                                <button type="button" data-action="addDebater" class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors ${this.state.positiveTeamPlayers.length >= 4 ? 'opacity-50 cursor-not-allowed' : ''}">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    新增辯士
                                </button>
                                <button type="button" data-action="removeDebater" class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg transition-colors ${this.state.positiveTeamPlayers.length <= 3 ? 'opacity-50 cursor-not-allowed' : ''}">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" /></svg>
                                    移除辯士
                                </button>
                                <span class="text-xs text-slate-400">目前：${this.state.positiveTeamPlayers.length} 位</span>
                            </div>
                        </div>
                        </div>
                        ` : ''}

                        <!-- Step 3：確認與進階設定 -->
                        ${currentStep === 3 ? `
                        <!-- 設定摘要 -->
                        <div class="glass-panel p-6 md:p-8 relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                            <div class="flex items-center gap-3 mb-6">
                                <span class="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500">
                                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </span>
                                <div>
                                    <h3 class="text-lg font-bold text-[var(--text-main)]">Step 3：確認設定</h3>
                                    <p class="text-xs text-slate-500">檢查設定並開始比賽</p>
                                </div>
                            </div>
                            
                            <!-- 摘要卡片 -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                ${this.state.tournamentName ? `
                                <div class="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 md:col-span-2">
                                    <div class="text-xs text-amber-600 dark:text-amber-400 mb-1">盃賽名稱</div>
                                    <div class="font-bold text-amber-700 dark:text-amber-300">${this.state.tournamentName}</div>
                                </div>
                                ` : ''}
                                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div class="text-xs text-slate-500 mb-1">辯題</div>
                                    <div class="font-bold text-[var(--text-main)] line-clamp-2">${this.state.debateTopic || '（未設定）'}</div>
                                </div>
                                <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div class="text-xs text-slate-500 mb-1">賽制</div>
                                    <div class="font-bold text-[var(--text-main)]">${this.state.selectedFormat && this.state.selectedFormat !== 'CUSTOM_EMPTY' ? this.state.selectedFormat : '（未選擇）'}</div>
                                </div>
                                <div class="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <div class="text-xs text-green-600 dark:text-green-400 mb-1">正方</div>
                                    <div class="font-bold text-green-700 dark:text-green-300">${this.state.positiveTeamName}</div>
                                    <div class="text-xs text-slate-500 mt-1">${this.state.positiveTeamPlayers.join('、')}</div>
                                </div>
                                <div class="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                    <div class="text-xs text-red-600 dark:text-red-400 mb-1">反方</div>
                                    <div class="font-bold text-red-700 dark:text-red-300">${this.state.negativeTeamName}</div>
                                    <div class="text-xs text-slate-500 mt-1">${this.state.negativeTeamPlayers.join('、')}</div>
                                </div>
                            </div>
                            
                            <!-- 隱藏的 select 用於保持賽制選擇 -->
                            <select id="formatSelect-step2" data-change-action="formatChanged" class="hidden">
                                ${formatOptions}
                            </select>
                        </div>

                        <!-- 進階設定 (可收合) -->
                        <details class="glass-panel overflow-hidden group" open>
                            <summary class="p-5 cursor-pointer select-none flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div class="flex items-center gap-3">
                                    <span class="p-2.5 rounded-xl bg-gradient-to-br from-slate-500/20 to-gray-500/20 text-slate-500">
                                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                                    </span>
                                    <div>
                                        <h3 class="text-sm font-bold text-[var(--text-main)]">進階設定（選填）</h3>
                                        <p class="text-xs text-slate-500">裁判、緩衝時間等</p>
                                    </div>
                                </div>
                                <svg class="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                            </summary>
                            <div class="px-5 pb-5 pt-2 border-t border-[var(--border-color)] space-y-4">
                                <!-- 裁判名稱 -->
                                <div>
                                    <div class="text-xs font-medium text-violet-600 dark:text-violet-400 mb-2 flex items-center gap-1">
                                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
                                        裁判名稱
                                    </div>
                                    <div id="judgeInputs" class="grid grid-cols-3 gap-2">
                                        ${this.state.judges.map((j, i) => `
                                            <input type="text" class="judge-name-input modern-input text-sm border-violet-200 dark:border-violet-800" data-index="${i}" placeholder="裁判 ${i + 1}" value="${j}">
                                        `).join('')}
                                    </div>
                                    <div class="flex items-center gap-2 mt-2">
                                        <button type="button" data-action="addJudge" class="text-xs text-emerald-600 hover:underline ${this.state.judges.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}">+ 新增</button>
                                        <button type="button" data-action="removeJudge" class="text-xs text-rose-600 hover:underline ${this.state.judges.length <= 1 ? 'opacity-50 cursor-not-allowed' : ''}">- 移除</button>
                                    </div>
                                </div>
                                <!-- 其他設定 -->
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--border-color)]">
                                    <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div class="flex items-center gap-2">
                                            <span class="text-sm font-medium">準備時間偵測</span>
                                        </div>
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" ${speechDetectionChecked} data-change-action="toggleSpeechDetection" class="sr-only peer">
                                            <div class="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                                        </label>
                                    </div>
                                    <div class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <span class="text-sm font-medium">強制計時秒數</span>
                                        <div class="flex items-center gap-1 bg-white dark:bg-slate-700 rounded px-2 py-1 border">
                                            <input type="number" data-change-action="setGraceDuration" class="bg-transparent w-10 text-center font-mono font-bold focus:outline-none" value="${this.state.customGraceDuration}" min="0" max="300">
                                            <span class="text-xs text-slate-500">秒</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>
                        ` : ''}
                        
                        <!-- 隱藏的 select 用於 Step 1 和 2 保持賽制選擇 -->
                        ${currentStep !== 3 ? `
                        <select id="formatSelect-fallback" data-change-action="formatChanged" class="hidden">
                            ${formatOptions}
                        </select>
                        ` : ''}
                    </div>
                </div>

                <div class="sticky-action-bar animate-fade-in-up">
                    <!-- 左側按鈕組 -->
                    <div class="flex gap-1">
                        ${currentStep > 1 ? `
                        <button data-action="prevSetupStep" class="flex items-center gap-1.5 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                            <span class="text-sm font-medium">上一步</span>
                        </button>
                        ` : ''}
                        <button data-action="openEditor" class="btn-icon-label hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl px-3 py-2 transition-all">
                            <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            <span class="text-xs">編輯流程</span>
                        </button>
                        <button data-action="showImportModal" class="btn-icon-label hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl px-3 py-2 transition-all">
                            <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            <span class="text-xs">匯入</span>
                        </button>
                        <button data-action="shareFlow" class="btn-icon-label hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-xl px-3 py-2 transition-all">
                            <svg class="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                            <span class="text-xs">分享</span>
                        </button>
                    </div>
                    <!-- 右側主按鈕 -->
                    ${currentStep < 3 ? `
                    <button data-action="nextSetupStep" class="btn-start-match flex items-center gap-2 group">
                        <span>下一步</span>
                        <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    ` : `
                    <button data-action="startDebate" class="btn-start-match flex items-center gap-2 group">
                        <span>開始比賽</span>
                        <svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                    </button>
                    `}
                </div>
            `;

        if (this.state.pendingSharedFlow) {
            setTimeout(() => {
                const formatSelect = document.getElementById('formatSelect');
                if (formatSelect) {
                    formatSelect.value = this.state.pendingSharedFlow;
                    formatSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
                delete this.state.pendingSharedFlow;
            }, 0);
        }

        const formatSelect = document.getElementById('formatSelect');
        if (formatSelect) {
            const changeEvent = new Event('change', { bubbles: true });
            Object.defineProperty(changeEvent, 'target', { value: formatSelect, writable: false });
            this.changeActions.formatChanged(changeEvent);
        }

        // 初始化搜尋功能
        this.initFormatSearch();

        // 清除盃賽名稱按鈕
        const clearTournamentBtn = document.getElementById('clearTournamentBtn');
        const tournamentNameInput = document.getElementById('tournamentNameInput');
        if (clearTournamentBtn && tournamentNameInput) {
            clearTournamentBtn.addEventListener('click', () => {
                tournamentNameInput.value = '';
                tournamentNameInput.focus();
            });
            // 即時同步到 state 並發送到投影模式
            tournamentNameInput.addEventListener('input', () => {
                App.state.tournamentName = tournamentNameInput.value.trim();
                App.sendProjectorUpdate();
            });
        }

        // 清除辯題按鈕
        const clearTopicBtn = document.getElementById('clearTopicBtn');
        const debateTopicInput = document.getElementById('debateTopicInput');
        if (clearTopicBtn && debateTopicInput) {
            clearTopicBtn.addEventListener('click', () => {
                debateTopicInput.value = '';
                debateTopicInput.focus();
            });
            // 即時同步到 state 並發送到投影模式
            debateTopicInput.addEventListener('input', () => {
                App.state.debateTopic = debateTopicInput.value.trim();
                App.sendProjectorUpdate();
            });
        }

        // 隊名輸入即時同步到投影模式
        const positiveTeamNameInput = document.getElementById('positiveTeamNameInput');
        if (positiveTeamNameInput) {
            positiveTeamNameInput.addEventListener('input', () => {
                App.state.positiveTeamName = positiveTeamNameInput.value.trim() || App.state.positiveTeamName;
                App.sendProjectorUpdate();
            });
        }
        const negativeTeamNameInput = document.getElementById('negativeTeamNameInput');
        if (negativeTeamNameInput) {
            negativeTeamNameInput.addEventListener('input', () => {
                App.state.negativeTeamName = negativeTeamNameInput.value.trim() || App.state.negativeTeamName;
                App.sendProjectorUpdate();
            });
        }

        // 辯手名稱輸入即時同步到投影模式
        const debaterInputs = document.querySelectorAll('.debater-name-input');
        debaterInputs.forEach(input => {
            input.addEventListener('input', () => {
                const team = input.dataset.team;
                const index = parseInt(input.dataset.index);
                const value = input.value.trim();

                if (team === 'positive' && App.state.positiveTeamPlayers[index] !== undefined) {
                    App.state.positiveTeamPlayers[index] = value || `正${['一', '二', '三', '四'][index] || (index + 1)}`;
                } else if (team === 'negative' && App.state.negativeTeamPlayers[index] !== undefined) {
                    App.state.negativeTeamPlayers[index] = value || `反${['一', '二', '三', '四'][index] || (index + 1)}`;
                }
                App.sendProjectorUpdate();
            });
        });

        // 結辯勾選即時同步到投影模式
        const closingRadios = document.querySelectorAll('.closing-radio');
        closingRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const team = radio.dataset.team;
                const index = parseInt(radio.dataset.index);

                if (team === 'positive') {
                    App.state.positiveClosingIndex = index;
                } else if (team === 'negative') {
                    App.state.negativeClosingIndex = index;
                }
                App.sendProjectorUpdate();
            });
        });
    },

    renderNineSquareGridView() {
        const renderGrid = (team, players) => {
            let gridHtml = `<div class="space-y-4"><h3 class="text-xl font-bold text-center ${team === 'positive' ? 'text-green-600' : 'text-red-600'}">${team === 'positive' ? this.state.positiveTeamName : this.state.negativeTeamName}</h3>`;

            // 表格：3輪 x 3個角色類型
            gridHtml += `<div class="overflow-x-auto"><table class="w-full border-collapse">`;

            // 表頭
            gridHtml += `<thead><tr class="bg-slate-200 dark:bg-slate-700">
                     <th class="p-2 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200"></th>
                     <th class="p-3 border border-slate-300 dark:border-slate-600 text-center font-semibold text-slate-800 dark:text-slate-200">申論</th>
                     <th class="p-3 border border-slate-300 dark:border-slate-600 text-center font-semibold text-slate-800 dark:text-slate-200">質詢</th>
                     <th class="p-3 border border-slate-300 dark:border-slate-600 text-center font-semibold text-slate-800 dark:text-slate-200">答辯</th>
                 </tr></thead>`;

            // 表格內容：三輪
            gridHtml += `<tbody>`;
            for (let round = 1; round <= 3; round++) {
                gridHtml += `<tr class="bg-slate-100 dark:bg-slate-800">
                         <td class="p-2 border border-slate-300 dark:border-slate-600 text-center font-semibold text-slate-600 dark:text-slate-300">第${['一', '二', '三'][round - 1]}輪</td>`;
                for (const type of ['申論', '質詢', '答辯']) {
                    gridHtml += `<td class="p-2 border border-slate-300 dark:border-slate-600">
                             <select id="${team}-${round}-${type}" class="form-element w-full text-center p-2 border-0 rounded-md bg-white dark:bg-slate-700">
                                 <option value="">選擇</option>
                                 ${players.map((p, i) => `<option value="${String.fromCharCode(65 + i)}">${p} (${String.fromCharCode(65 + i)})</option>`).join('')}
                             </select>
                         </td>`;
                }
                gridHtml += `</tr>`;
            }
            gridHtml += `</tbody></table></div></div>`;
            return gridHtml;
        };

        this.mainContent.innerHTML = `
                <div class="max-w-5xl mx-auto space-y-8">
                    <div class="text-center">
                        <h2 class="text-3xl font-extrabold tracking-tight">辯革盃九宮格佈陣</h2>
                        <p class="mt-2 text-lg text-slate-500">請為雙方安排三輪的申論、質詢、答辯人選。</p>
                        <p class="mt-1 text-sm text-slate-400">規則：每位辯士 (A, B, C) 需各負責三項環節（每人恰好填入三格）。</p>
                        <p class="mt-1 text-sm text-slate-400">例：A 負責第一輪答辯、第二輪質詢、第三輪申論。</p>
                    </div>
                    <div class="glass-card p-6 sm:p-8 rounded-2xl shadow-lg space-y-8">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            ${renderGrid('positive', this.state.positiveTeamPlayers)}
                            ${renderGrid('negative', this.state.negativeTeamPlayers)}
                        </div>
                    </div>
                    <div class="flex flex-col items-center gap-4">
                        <button data-action="confirmNineSquare" class="px-8 py-3 rounded-lg text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors font-semibold">確認佈陣並開始比賽</button>
                        <button data-action="backToSetup" class="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">返回設定頁面</button>
                    </div>
                </div>
            `;
    },

    renderDebateView() {
        // 使用 Grid 佈局：左側是主計時區，右側是逐字稿
        // 行動裝置只顯示：計時器、錄音介面、dock、贊助區
        this.mainContent.innerHTML = `
            <div class="debate-layout grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full pb-28">
                <!-- 主計時區 -->
                <div class="lg:col-span-8 flex flex-col gap-4 h-full">
                    <!-- 頂部資訊列 - 行動裝置隱藏 -->
                    <div id="debateInfoContainer" class="hidden md:grid grid-cols-1 md:grid-cols-2 gap-3"></div>
                    
                    <!-- 比賽流程追蹤器 - 行動裝置隱藏 -->
                    <div id="debateFlowTracker" class="debate-flow-tracker hidden md:flex"></div>
                    
                    <!-- 計時器容器 - 始終顯示 -->
                    <div id="timerContainer" class="flex-grow flex flex-col min-h-[280px]"></div>
                    
                    <!-- 當前階段講稿 -->
                    <div id="stageContainer"></div>
                </div>

                <!-- 逐字稿面板 - 始終顯示 -->
                <div class="lg:col-span-4 h-[400px] lg:h-[500px]">
                    <div id="transcriptionPanel" class="glass-panel transcription-card overflow-hidden h-full"></div>
                </div>
            </div>

            <!-- 控制列 - 始終顯示 -->
            <div id="debateControlsContainer"></div>
            
            <!-- 贊助區 - 始終顯示 -->
            <div id="promotionWrapper" class="mt-6 opacity-40 hover:opacity-100 transition-opacity duration-300">${this.renderPromotionArea()}</div>
        `;
        this.renderDebateFlowTracker();
        this.renderDebateStage();
        this.renderTranscriptionPanel();
    },

    // 渲染比賽流程追蹤器
    renderDebateFlowTracker() {
        const tracker = document.getElementById('debateFlowTracker');
        if (!tracker) return;

        const { currentFlow, currentStageIndex } = this.state;
        if (!currentFlow || currentFlow.length === 0) {
            tracker.style.display = 'none';
            return;
        }

        // 如果階段太多（超過12個），只顯示附近的階段
        const maxVisible = 12;
        let startIdx = 0;
        let endIdx = currentFlow.length;

        if (currentFlow.length > maxVisible) {
            startIdx = Math.max(0, currentStageIndex - Math.floor(maxVisible / 2));
            endIdx = Math.min(currentFlow.length, startIdx + maxVisible);
            if (endIdx - startIdx < maxVisible) {
                startIdx = Math.max(0, endIdx - maxVisible);
            }
        }

        let html = '';

        // 如果開頭被截斷，顯示省略號
        if (startIdx > 0) {
            html += `<span class="text-xs text-slate-400 px-1">...</span>`;
        }

        for (let i = startIdx; i < endIdx; i++) {
            const stage = currentFlow[i];
            const isCompleted = i < currentStageIndex;
            const isCurrent = i === currentStageIndex;
            const isUpcoming = i > currentStageIndex;

            // 階段狀態類別
            let stateClass = '';
            if (isCompleted) stateClass = 'completed';
            else if (isCurrent) stateClass = 'current';
            else if (isUpcoming) stateClass = 'upcoming';

            // 階段圖示
            let icon = '🎤';
            if (stage.type === 'manual_prep') icon = '⏱️';
            else if (stage.type === 'announcement') icon = '📢';
            else if (stage.type === 'free_debate') icon = '⚔️';
            else if (stage.type === 'draw_rebuttal_order') icon = '🎲';
            else if (stage.type === 'choice_speech') icon = '🔀';

            // 簡短名稱（取前幾個字）
            const shortName = (stage.timerLabel || stage.name || '').substring(0, 6) + (stage.name && stage.name.length > 6 ? '...' : '');

            // 連接線
            if (i > startIdx) {
                const connectorClass = isCompleted ? 'completed' : '';
                html += `<div class="flow-connector ${connectorClass}"></div>`;
            }

            html += `
                <div class="flow-stage ${stateClass}" title="${stage.name || '階段'}" data-action="goToStage" data-stage="${i}">
                    <span>${icon}</span>
                    <span>${shortName}</span>
                    ${isCompleted ? '<svg class="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ''}
                </div>
            `;
        }

        // 如果結尾被截斷，顯示省略號
        if (endIdx < currentFlow.length) {
            html += `<span class="text-xs text-slate-400 px-1">...</span>`;
        }

        tracker.innerHTML = html;

        // 加入滑鼠拖曳與觸控滾動功能
        if (!tracker._dragScrollInitialized) {
            tracker._dragScrollInitialized = true;
            let isDown = false;
            let startX;
            let scrollLeft;

            // 滑鼠拖曳
            tracker.addEventListener('mousedown', (e) => {
                if (e.target.closest('[data-action]')) return;
                isDown = true;
                tracker.style.cursor = 'grabbing';
                startX = e.pageX - tracker.offsetLeft;
                scrollLeft = tracker.scrollLeft;
            });

            tracker.addEventListener('mouseleave', () => {
                isDown = false;
                tracker.style.cursor = 'grab';
            });

            tracker.addEventListener('mouseup', () => {
                isDown = false;
                tracker.style.cursor = 'grab';
            });

            tracker.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - tracker.offsetLeft;
                const walk = (x - startX) * 2;
                tracker.scrollLeft = scrollLeft - walk;
            });

            // 滑鼠滾輪水平滾動
            tracker.addEventListener('wheel', (e) => {
                if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                    // 已經是水平滾動，不處理
                    return;
                }
                e.preventDefault();
                tracker.scrollLeft += e.deltaY;
            }, { passive: false });

            // 觸控滑動
            let touchStartX = 0;
            let touchScrollLeft = 0;

            tracker.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].pageX;
                touchScrollLeft = tracker.scrollLeft;
            }, { passive: true });

            tracker.addEventListener('touchmove', (e) => {
                const touchX = e.touches[0].pageX;
                const walk = touchStartX - touchX;
                tracker.scrollLeft = touchScrollLeft + walk;
            }, { passive: true });
        }

        // 自動滾動到當前階段
        setTimeout(() => {
            const currentStageEl = tracker.querySelector('.flow-stage.current');
            if (currentStageEl) {
                currentStageEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }, 100);
    },


    // [REPLACE] 請用這段完整的程式碼替換掉您檔案中現有的 renderFreeDebateView() 函式

    renderFreeDebateView() {
        const { freeDebate, positiveTeamName, negativeTeamName } = this.state;
        const { positiveTimeLeft, negativeTimeLeft, initialDuration, activeTeam, isPaused } = freeDebate;

        const positiveProgress = (positiveTimeLeft / initialDuration) * 100;
        const negativeProgress = (negativeTimeLeft / initialDuration) * 100;

        // 行動裝置只顯示：計時器、錄音介面、dock、贊助區
        this.mainContent.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-24">
                <div class="lg:col-span-8 flex flex-col gap-6 h-full">
                    
                    <!-- 頂部資訊列 - 行動裝置隱藏 -->
                    <div id="debateInfoContainer" class="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="md:col-span-2 glass-panel p-5 flex flex-col justify-center relative overflow-hidden min-h-[5rem]">
                            <div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-dark)]"></div>
                            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 pl-2">本場辯題</span>
                            <h2 class="text-xl md:text-2xl font-black text-[var(--text-main)] leading-tight pl-2">
                                ${this.state.debateTopic || "（未設定辯題）"}
                            </h2>
                        </div>
                        <div class="glass-panel p-4 flex flex-col justify-center border-l-4 border-green-500 min-h-[4.5rem]">
                            <span class="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">正方</span>
                            <span class="font-bold text-lg truncate text-[var(--text-main)]">${positiveTeamName}</span>
                        </div>
                        <div class="glass-panel p-4 flex flex-col justify-center border-l-4 border-red-500 min-h-[4.5rem]">
                            <span class="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1 text-right">反方</span>
                            <span class="font-bold text-lg truncate text-[var(--text-main)] text-right">${negativeTeamName}</span>
                        </div>
                    </div>

                    <!-- 計時器容器 - 始終顯示 -->
                    <div id="timerContainer" class="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div id="posTimerCard" class="glass-panel p-6 md:p-10 rounded-3xl text-center flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300 ${activeTeam === 'positive' && !isPaused ? 'ring-4 ring-green-500 shadow-lg shadow-green-500/20 scale-[1.02] opacity-100' : 'opacity-60 grayscale-[0.5] scale-95'}">
                            <p class="font-bold text-green-600 text-xl mb-2 uppercase tracking-wider">正方發言</p>
                            <div id="posTimerNum" class="font-mono font-black text-7xl md:text-8xl my-4 text-[var(--text-main)] tracking-tighter leading-none">${this.formatTime(positiveTimeLeft)}</div>
                            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mt-4 overflow-hidden">
                                <div id="posProgressBar" class="bg-green-500 h-full rounded-full transition-all duration-300" style="width: ${positiveProgress}%"></div>
                            </div>
                            ${activeTeam === 'positive' && !isPaused ? '<div class="absolute inset-0 bg-green-500/5 pointer-events-none animate-pulse"></div>' : ''}
                        </div>

                        <div id="negTimerCard" class="glass-panel p-6 md:p-10 rounded-3xl text-center flex flex-col justify-center items-center relative overflow-hidden transition-all duration-300 ${activeTeam === 'negative' && !isPaused ? 'ring-4 ring-red-500 shadow-lg shadow-red-500/20 scale-[1.02] opacity-100' : 'opacity-60 grayscale-[0.5] scale-95'}">
                            <p class="font-bold text-red-600 text-xl mb-2 uppercase tracking-wider">反方發言</p>
                            <div id="negTimerNum" class="font-mono font-black text-7xl md:text-8xl my-4 text-[var(--text-main)] tracking-tighter leading-none">${this.formatTime(negativeTimeLeft)}</div>
                            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mt-4 overflow-hidden">
                                <div id="negProgressBar" class="bg-red-500 h-full rounded-full transition-all duration-300" style="width: ${negativeProgress}%"></div>
                            </div>
                            ${activeTeam === 'negative' && !isPaused ? '<div class="absolute inset-0 bg-red-500/5 pointer-events-none animate-pulse"></div>' : ''}
                        </div>
                    </div>

                    <!-- 當前階段講稿 -->
                    <div id="stageContainer">
                        <div class="glass-panel p-6 flex items-start gap-5 animate-scale-in">
                            <div class="flex-shrink-0 w-12 h-12 rounded-2xl bg-[var(--surface-2)] text-red-500 flex items-center justify-center text-2xl shadow-inner">
                                ⚖️
                            </div>
                            <div class="flex-grow">
                                <h3 class="font-bold text-xl text-[var(--color-primary)] mb-1">${this.interpolateScript(freeDebate.stage.name)}</h3>
                                <p class="text-slate-600 dark:text-slate-300 text-base leading-relaxed font-medium">${this.interpolateScript(freeDebate.stage.script)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 逐字稿面板 - 始終顯示 -->
                <div class="lg:col-span-4 h-[400px] lg:h-[500px]">
                    <div id="transcriptionPanel" class="glass-panel transcription-card overflow-hidden h-full"></div>
                </div>
            </div>
            <!-- 控制列 - 始終顯示 -->
            <div id="debateControlsContainer"></div>
            <!-- 贊助區 - 始終顯示 -->
            <div id="promotionWrapper" class="mt-8 opacity-50 hover:opacity-100 transition-opacity">${this.renderPromotionArea()}</div>
        `;

        this._clearFreeDebateCache(); // 清除 DOM 快取
        this.renderFreeDebateControls();
        this.renderTranscriptionPanel();
    },
    // [ADD THIS NEW FUNCTION to your App object, near the other render...Controls functions]

    renderFreeDebateControls() {
        const container = document.getElementById('debateControlsContainer');
        if (!container) return;

        const { freeDebate, positiveTeamName, negativeTeamName, isAutoMode, currentStageIndex, currentFlow, recording, enableSpeech, pip } = this.state;
        const { isPaused, firstSpeakerSelected, activeTeam, positiveTimeLeft, negativeTimeLeft } = freeDebate;
        const { isMicMuted, micAudioTrack } = recording;

        const isTimerRunning = !!freeDebate.interval;
        const prevBtnDisabled = currentStageIndex <= 0 || (isTimerRunning && !isPaused);
        const nextBtnDisabled = (isTimerRunning && !isPaused);
        const autoModeChecked = isAutoMode ? 'checked' : '';
        const speechEnabledChecked = enableSpeech ? 'checked' : '';

        // --- 主按鈕邏輯 (Free Debate 專用) ---
        let mainBtnAction = 'togglePauseFreeDebate';
        let mainBtnIconType = 'play';
        let mainBtnClass = 'primary-play';
        let isMainBtnDisabled = false;

        if (!firstSpeakerSelected) {
            // 尚未選擇發言者：禁用主播放鍵，提示使用者先選隊伍
            isMainBtnDisabled = true;
            mainBtnIconType = 'play';
            mainBtnClass += ' opacity-50 cursor-not-allowed grayscale';
        } else {
            // 已開始：按鈕為暫停/繼續
            mainBtnIconType = isPaused ? 'play' : 'pause';
        }

        const hasActiveHiddenFeatures = isAutoMode || enableSpeech || (pip && pip.isActive);

        // 圖示 (與 renderDebateControls 共用，這裡簡化重複代碼，實際請複製上方完整的 icons 物件)
        const icons = {
            prev: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>`,
            next: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>`,
            play: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
            pause: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
            mic: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>`,
            micOff: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke-dasharray="2 2" /><line x1="1" y1="1" x2="23" y2="23" /></svg>`,
            menu: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>`,
            close: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
            pip: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>`,
            fullscreen: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>`,
            exitFullscreen: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" /></svg>`,
            projector: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" /></svg>`,
            reset: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>`,
            speech: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>`,
            auto: `<span class="font-bold text-xs">AUTO</span>`,
            undo: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>`
        };

        const isFullscreen = document.fullscreenElement || document.body.classList.contains('presentation-mode');
        const { projector } = this.state;

        let mainControlsHTML = '';
        // 如果還沒選隊伍，上方顯示兩個大按鈕
        if (!firstSpeakerSelected) {
            mainControlsHTML = `
                <div class="grid grid-cols-2 gap-4 mb-4 w-full max-w-lg mx-auto px-4 animate-fade-in-up">
                    <button data-action="startFreeDebate" data-team="positive" class="bg-green-500 hover:bg-green-600 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg hover:shadow-green-500/30 flex flex-col items-center gap-1">
                        <span class="text-sm opacity-80">正方發言</span>
                        <span class="text-lg">${positiveTeamName}</span>
                    </button>
                    <button data-action="startFreeDebate" data-team="negative" class="bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg hover:shadow-red-500/30 flex flex-col items-center gap-1">
                        <span class="text-sm opacity-80">反方發言</span>
                        <span class="text-lg">${negativeTeamName}</span>
                    </button>
                </div>`;
        } else {
            // 如果已選隊伍，上方顯示「切換隊伍」大按鈕
            const switchBtnColor = activeTeam === 'positive' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600';
            const switchBtnText = activeTeam === 'positive' ? `換 ${negativeTeamName} 發言` : `換 ${positiveTeamName} 發言`;
            const canSwitch = (activeTeam === 'positive' && negativeTimeLeft > 0) || (activeTeam === 'negative' && positiveTimeLeft > 0) || activeTeam === null;

            mainControlsHTML = `
                <div class="flex justify-center mb-4 px-4 animate-fade-in-up">
                    <button data-action="switchFreeDebate" class="${switchBtnColor} text-white font-bold py-3 px-12 text-xl rounded-full transition-transform transform hover:scale-105 shadow-lg ${!canSwitch || isPaused ? 'opacity-50 cursor-not-allowed' : ''}" ${!canSwitch || isPaused ? 'disabled' : ''}>
                        ${switchBtnText}
                    </button>
                </div>`;
        }

        // Dock 結構
        container.innerHTML = `
            ${mainControlsHTML}

            <div class="control-dock-wrapper">
                <div id="dockPopupMenu" class="dock-popup-menu">
                    <div class="menu-item-wrap"><button data-action="toggleAutoMode" class="dock-btn ${isAutoMode ? 'is-active' : ''}" aria-label="切換自動模式">${icons.auto}</button><span class="menu-label">自動</span></div>
                    <div class="menu-item-wrap"><button data-action="toggleSpeech" class="dock-btn ${enableSpeech ? 'is-active' : ''}" aria-label="切換語音朗讀">${icons.speech}</button><span class="menu-label">朗讀</span></div>
                    <div class="w-[1px] h-8 bg-white/10 mx-2 my-auto"></div>
                    <div class="menu-item-wrap"><button data-action="togglePip" class="dock-btn ${pip && pip.isActive ? 'is-active' : ''}" aria-label="畫中畫">${icons.pip}</button><span class="menu-label">畫中畫</span></div>
                    <div class="menu-item-wrap"><button data-action="toggleProjectorMode" class="dock-btn ${projector && projector.isActive ? 'is-active' : ''}" aria-label="投影模式">${icons.projector}</button><span class="menu-label">投影</span></div>
                    <div class="menu-item-wrap"><button data-action="toggleFullscreen" class="dock-btn ${isFullscreen ? 'is-active' : ''}" aria-label="${isFullscreen ? '退出全螢幕' : '全螢幕'}">${isFullscreen ? icons.exitFullscreen : icons.fullscreen}</button><span class="menu-label">${isFullscreen ? '退出' : '全螢幕'}</span></div>
                    <div class="w-[1px] h-8 bg-white/10 mx-2 my-auto"></div>
                    <div class="menu-item-wrap"><button data-action="undo" class="dock-btn" aria-label="復原">${icons.undo}</button><span class="menu-label">復原</span></div>
                    <div class="menu-item-wrap"><button data-action="resetDebate" class="dock-btn" style="color: #ef4444;" aria-label="重設比賽">${icons.reset}</button><span class="menu-label text-red-400">重設</span></div>
                </div>

                <div class="main-dock-bar">
                    <button data-action="toggleMicMute" class="dock-btn ${isMicMuted ? 'is-active' : ''}" style="${isMicMuted ? 'color:#ef4444; background:rgba(239,68,68,0.1);' : ''}" ${!micAudioTrack ? 'disabled style="opacity:0.3"' : ''} aria-label="麥克風開關">
                        ${isMicMuted ? icons.micOff : icons.mic}
                    </button>
                    <button data-action="previousStage" class="dock-btn" ${prevBtnDisabled ? 'disabled style="opacity:0.3"' : ''} aria-label="上一階段">
                        ${icons.prev}
                    </button>
                    
                    <button data-action="${mainBtnAction}" class="dock-btn ${mainBtnClass}" aria-label="暫停/繼續" ${isMainBtnDisabled ? 'disabled' : ''}>
                        ${icons[mainBtnIconType]}
                    </button>

                    <button data-action="nextStage" class="dock-btn" ${nextBtnDisabled ? 'disabled style="opacity:0.3"' : ''} aria-label="下一階段">
                        ${icons.next}
                    </button>
                    <button id="dockMenuToggle" class="dock-btn ${hasActiveHiddenFeatures ? 'has-indicator' : ''}" aria-label="更多選項">
                        ${icons.menu}
                    </button>
                </div>
            </div>
        `;

        // 事件綁定 (與 renderDebateControls 相同，直接複製)
        const toggleBtn = document.getElementById('dockMenuToggle');
        const menu = document.getElementById('dockPopupMenu');
        if (toggleBtn && menu) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('open');
                const isOpen = menu.classList.contains('open');
                toggleBtn.innerHTML = isOpen ? icons.close : icons.menu;
                if (hasActiveHiddenFeatures) toggleBtn.classList.toggle('has-indicator', !isOpen);
            });
            menu.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (btn) {
                    const action = btn.dataset.action;
                    if (['toggleFullscreen', 'resetDebate', 'undo'].includes(action)) {
                        menu.classList.remove('open');
                        toggleBtn.innerHTML = icons.menu;
                    }
                }
            });
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !toggleBtn.contains(e.target) && menu.classList.contains('open')) {
                    menu.classList.remove('open');
                    toggleBtn.innerHTML = icons.menu;
                    if (hasActiveHiddenFeatures) toggleBtn.classList.add('has-indicator');
                }
            }, { once: true });
        }
    },


    startFreeDebateTimer(team) {
        const { freeDebate } = this.state;
        if ((team === 'positive' && freeDebate.positiveTimeLeft <= 0) || (team === 'negative' && freeDebate.negativeTimeLeft <= 0)) {
            return; // 時間用完，不能開始
        }

        clearInterval(freeDebate.interval);
        freeDebate.activeTeam = team;
        freeDebate.isPaused = false;
        const wasFirstSpeaker = !freeDebate.firstSpeakerSelected;
        if (!freeDebate.firstSpeakerSelected) freeDebate.firstSpeakerSelected = true;

        freeDebate.interval = setInterval(() => this.runFreeDebateInterval(), 1000);

        // [效能優化] 首次選擇發言方需要完整重繪（顯示控制列），之後只更新狀態
        if (wasFirstSpeaker) {
            this.renderFreeDebateView();
        } else {
            this.updateFreeDebateDisplay();
            this.renderFreeDebateControls();
        }
    },

    runFreeDebateInterval() {
        const { freeDebate } = this.state;
        if (freeDebate.isPaused) return;

        if (freeDebate.activeTeam === 'positive') {
            freeDebate.positiveTimeLeft--;
        } else if (freeDebate.activeTeam === 'negative') {
            freeDebate.negativeTimeLeft--;
        }

        this.updateFreeDebateDisplay();

        // [ADD THIS LINE] 在自由辯論計時器跳動時，也更新 PiP 畫面
        if (this.state.pip.isActive) {
            this.renderPipCanvas();
        }

        // 如果有開啟投影模式，同步更新外部顯示
        if (this.state.projector.isActive) {
            this.sendProjectorUpdate();
        }

        const timeLeft = freeDebate.activeTeam === 'positive' ? freeDebate.positiveTimeLeft : freeDebate.negativeTimeLeft;
        if (timeLeft <= 0) {
            // --- 新增：觸發視覺閃爍 ---
            document.body.classList.add('visual-alarm');
            setTimeout(() => document.body.classList.remove('visual-alarm'), 3000);
            // -------------------------

            this.playRingSound(3);
            clearInterval(freeDebate.interval);
            freeDebate.interval = null;
            const finishedTeam = freeDebate.activeTeam === 'positive' ? this.state.positiveTeamName : this.state.negativeTeamName;
            this.showNotification(`${finishedTeam} 時間已用完`, 'info');
            freeDebate.activeTeam = null;
            this.renderFreeDebateView();
        }
    },
    // [效能優化] 自由辯論計時器 DOM 快取
    _cachedFreeDebateEls: null,
    _lastRouterView: null, // [記憶體優化] 追蹤上一個視圖用於快取清理

    _getFreeDebateEls() {
        if (!this._cachedFreeDebateEls) {
            this._cachedFreeDebateEls = {
                posTimer: document.getElementById('posTimerNum'),
                posBar: document.getElementById('posProgressBar'),
                posCard: document.getElementById('posTimerCard'),
                negTimer: document.getElementById('negTimerNum'),
                negBar: document.getElementById('negProgressBar'),
                negCard: document.getElementById('negTimerCard')
            };
        }
        return this._cachedFreeDebateEls;
    },

    _clearFreeDebateCache() {
        this._cachedFreeDebateEls = null;
    },

    // [記憶體優化] 清理比賽相關的記憶體
    clearDebateMemory() {
        // 清理 transcription 段落
        this.state.transcription.paragraphs = [];
        this.state.transcription.currentParagraphId = null;
        this.state.transcription.interimContent = '';

        // 清理錄音資料
        this.state.recording.recordedChunks = [];
        this.state.recording.intermediateBlobs = [];
        this.state.recording.audioBlob = null;

        // [方案 A] 銷毀持久化 VAD 並釋放麥克風
        this.destroyPersistentVAD();

        // [多分頁衝突防護] 釋放語音偵測鎖
        this.releaseSpeechLock();

        // 清理 DOM 快取
        this._cachedFreeDebateEls = null;
        this._cachedTimerEl = null;
        this._cachedProgressEl = null;

        console.log('[Memory] Cleared debate memory cache');
    },

    // [記憶體優化] 合併錄音 chunks 到中間 Blob
    _consolidateRecordingChunks() {
        const { recordedChunks, intermediateBlobs } = this.state.recording;
        const chunkCount = recordedChunks.length; // 先記錄長度
        if (chunkCount > 0) {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            intermediateBlobs.push(blob);
            this.state.recording.recordedChunks = [];
            console.log(`[Memory] Consolidated ${chunkCount} chunks into blob (total: ${intermediateBlobs.length} blobs)`);
        }
    },

    updateFreeDebateDisplay() {
        const { positiveTimeLeft, negativeTimeLeft, initialDuration, activeTeam, isPaused } = this.state.freeDebate;
        const els = this._getFreeDebateEls();

        // 1. 更新正方
        const posTimer = els.posTimer;
        const posBar = els.posBar;
        if (posTimer) posTimer.textContent = this.formatTime(positiveTimeLeft);
        if (posBar) posBar.style.width = `${(positiveTimeLeft / initialDuration) * 100}%`;

        // 2. 更新反方
        const negTimer = els.negTimer;
        const negBar = els.negBar;
        if (negTimer) negTimer.textContent = this.formatTime(negativeTimeLeft);
        if (negBar) negBar.style.width = `${(negativeTimeLeft / initialDuration) * 100}%`;

        // 3. 更新卡片的活動狀態 (使用 CSS 類別切換而非重繪)
        const posCard = els.posCard;
        const negCard = els.negCard;
        if (posCard) {
            posCard.classList.toggle('active-team', activeTeam === 'positive' && !isPaused);
            posCard.classList.toggle('inactive-team', activeTeam !== 'positive' || isPaused);
        }
        if (negCard) {
            negCard.classList.toggle('active-team', activeTeam === 'negative' && !isPaused);
            negCard.classList.toggle('inactive-team', activeTeam !== 'negative' || isPaused);
        }

        // 3. 若有開啟畫中畫，同步更新
        if (this.state.pip.isActive) {
            this.renderPipCanvas();
        }
    },

    switchFreeDebateTeam() {
        // 1. 決定下一隊是誰
        const currentActive = this.state.freeDebate.activeTeam;
        const nextTeam = currentActive === 'positive' ? 'negative' : 'positive';
        this.startFreeDebateTimer(nextTeam);
    },

    togglePauseFreeDebate() {
        const { freeDebate } = this.state;
        freeDebate.isPaused = !freeDebate.isPaused;

        if (freeDebate.isPaused) {
            clearInterval(freeDebate.interval);
        } else if (freeDebate.activeTeam) {
            freeDebate.interval = setInterval(() => this.runFreeDebateInterval(), 1000);
        }
        // [效能優化] 只更新需要的部分，不重繪整個視圖
        this.updateFreeDebateDisplay();
        this.renderFreeDebateControls();
    },

    resetFreeDebate() {
        this.loadStage(this.state.currentStageIndex); // 重新載入當前階段即可重設
    },

    renderDebateStage() {
        const stage = this.state.currentFlow[this.state.currentStageIndex];
        const infoContainer = document.getElementById('debateInfoContainer');
        const stageContainer = document.getElementById('stageContainer');
        const timerContainer = document.getElementById('timerContainer');

        if (!infoContainer || !stageContainer || !timerContainer) return;

        // 計算進度
        const totalStages = this.state.currentFlow.length;
        const currentProgress = totalStages > 0 ? ((this.state.currentStageIndex + 1) / totalStages) * 100 : 0;

        // --- 頂部資訊列：辯題 + 雙方隊伍 + 進度 ---
        infoContainer.innerHTML = `
            <!-- 辯題橫幅 -->
            <div class="md:col-span-2 glass-panel p-4 relative overflow-hidden group">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500"></div>
                <div class="flex items-center justify-between gap-4">
                    <div class="flex-grow pl-3">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">辯題</span>
                            <span class="text-[10px] text-slate-400">|</span>
                            <span class="text-[10px] text-slate-400">第 ${this.state.currentStageIndex + 1} / ${totalStages} 階段</span>
                        </div>
                        <h2 class="text-lg md:text-xl font-black text-[var(--text-main)] leading-snug line-clamp-2">
                            ${this.state.debateTopic || "（未設定辯題）"}
                        </h2>
                    </div>
                    <!-- 進度環 -->
                    <div class="flex-shrink-0 relative w-12 h-12">
                        <svg class="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="3" class="text-slate-200 dark:text-slate-700"/>
                            <circle cx="18" cy="18" r="15" fill="none" stroke="url(#progressGradient)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${currentProgress}, 100" class="transition-all duration-500"/>
                            <defs>
                                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stop-color="#6366f1"/>
                                    <stop offset="100%" stop-color="#a855f7"/>
                                </linearGradient>
                            </defs>
                        </svg>
                        <span class="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--text-main)]">${Math.round(currentProgress)}%</span>
                    </div>
                </div>
            </div>

            <!-- 正方卡片 -->
            <div class="glass-panel p-3 flex items-center gap-3 relative overflow-hidden group hover:shadow-md hover:shadow-green-500/10 transition-all">
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500"></div>
                <div class="flex-grow min-w-0 pl-2">
                    <span class="text-[10px] font-bold uppercase text-green-500 tracking-wider">正方</span>
                    <p class="font-bold text-base truncate text-[var(--text-main)]" title="${this.state.positiveTeamName}">${this.state.positiveTeamName}</p>
                </div>
            </div>

            <!-- 反方卡片 -->
            <div class="glass-panel p-3 flex items-center gap-3 relative overflow-hidden group hover:shadow-md hover:shadow-red-500/10 transition-all">
                <div class="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-400 to-rose-500"></div>
                <div class="flex-grow min-w-0 text-right pr-2">
                    <span class="text-[10px] font-bold uppercase text-red-500 tracking-wider">反方</span>
                    <p class="font-bold text-base truncate text-[var(--text-main)]" title="${this.state.negativeTeamName}">${this.state.negativeTeamName}</p>
                </div>
            </div>
        `;

        if (!stage) {
            stageContainer.innerHTML = `<div class="text-center p-8 text-slate-500">準備就緒...</div>`;
            this.renderDebateControls();
            return;
        }

        // 計時器邏輯
        let timerContent = '';
        let timerStateClass = '';

        const timeLeft = (typeof this.state.timer.timeLeft === 'number') ? this.state.timer.timeLeft : (stage.duration || 0);
        const initial = (typeof this.state.timer.initialDuration === 'number') && this.state.timer.initialDuration > 0 ? this.state.timer.initialDuration : (stage.duration || 1);
        const progress = (timeLeft / initial) * 100;

        // 使用統一的計時器狀態判斷
        const timerState = this.getTimerState(timeLeft, initial);
        if (this.state.timer.interval || this.state.timer.graceInterval) timerStateClass += ' state-running';
        if (timerState === 'warning') timerStateClass += ' state-warning';
        if (timerState === 'danger') timerStateClass += ' state-danger';

        if (stage.type === 'judge_comment') {
            // 裁判講評：無計時器顯示
            const judges = this.state.judges || ['裁判一', '裁判二', '裁判三'];
            const commentedCount = (this.state.judgeCommentOrder || []).length;
            const currentJudge = this.state.currentJudge;
            const allDone = commentedCount >= judges.length;

            let judgeDisplay = '';
            let actionButtons = '';

            if (allDone) {
                judgeDisplay = `
                            <div class="text-lg text-slate-500 mb-2">講評完畢</div>
                            <div class="text-4xl font-black bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">✅</div>
                            <div class="text-xl font-bold text-[var(--text-main)] mt-2">所有裁判已講評</div>
                        `;
                actionButtons = `
                            <div class="mt-6">
                                <button data-action="nextStage" class="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all font-bold text-lg">
                                    繼續下一階段 →
                                </button>
                            </div>
                        `;
            } else if (currentJudge) {
                judgeDisplay = `
                            <div class="text-lg text-slate-500 mb-2">正在講評</div>
                            <div class="text-4xl font-black bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">${currentJudge.name}</div>
                            <div class="text-xl font-bold text-[var(--text-main)] mt-2">第 ${commentedCount} / ${judges.length} 位</div>
                        `;
                // 顯示結束講評按鈕
                const nextJudgeText = commentedCount < judges.length ? '選擇下一位裁判' : '完成所有講評';
                actionButtons = `
                            <div class="mt-6">
                                <button data-action="finishJudgeComment" class="px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all font-bold text-xl flex items-center gap-3 mx-auto">
                                    <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    結束講評
                                </button>
                                <p class="text-sm text-slate-400 mt-3">${nextJudgeText}</p>
                            </div>
                        `;
            } else {
                judgeDisplay = `
                            <div class="text-lg text-slate-500 mb-2">等待選擇</div>
                            <div class="text-6xl font-black text-violet-400">🎓</div>
                            <div class="text-xl font-bold text-[var(--text-main)] mt-2">請選擇裁判</div>
                        `;
            }

            timerContent = `
                <div class="glass-panel hero-timer-card text-center flex-grow rounded-3xl">
                    <div class="flex items-center justify-center gap-3 mb-6">
                        <span class="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-violet-500/30">🎓</span>
                        <h3 class="text-2xl font-black text-[var(--text-main)]">裁判講評</h3>
                    </div>
                    <div class="py-4">${judgeDisplay}</div>
                    ${actionButtons}
                    <div class="mt-4 text-sm text-slate-500">
                        ${commentedCount > 0 ? `已講評：${this.state.judgeCommentOrder.map(i => judges[i]).join(' → ')}` : '尚未開始講評'}
                    </div>
                </div>`;
        } else if (stage.type === 'draw_rebuttal_order') {
            timerContent = `
                <div class="glass-panel hero-timer-card text-center flex-grow rounded-3xl">
                    <div class="flex items-center justify-center gap-3 mb-6">
                        <span class="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30">🎲</span>
                        <h3 class="text-2xl font-black text-[var(--text-main)]">結辯順序抽籤</h3>
                    </div>
                    ${this.state.rebuttalOrder
                    ? `<div class="py-6">
                            <div class="text-lg text-slate-500 mb-2">抽籤結果</div>
                            <div class="text-4xl font-black bg-gradient-to-r ${this.state.rebuttalOrder === 'positive' ? 'from-green-500 to-emerald-500' : 'from-red-500 to-rose-500'} bg-clip-text text-transparent animate-pulse">${this.state.rebuttalOrder === 'positive' ? this.state.positiveTeamName : this.state.negativeTeamName}</div>
                            <div class="text-xl font-bold text-[var(--text-main)] mt-2">先結辯</div>
                        </div>`
                    : `<div class="py-6">
                            <button data-action="startDraw" class="px-10 py-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all font-bold text-xl flex items-center gap-3 mx-auto">
                                <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                開始抽籤
                            </button>
                        </div>`
                }
                    <div class="mt-6 flex gap-6 justify-center text-sm">
                        <button data-action="manualSetRebuttalOrder" data-team="positive" class="text-slate-500 hover:text-green-600 hover:underline decoration-2 underline-offset-4 transition-all flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-green-500"></span> 指定正方先
                        </button>
                        <button data-action="manualSetRebuttalOrder" data-team="negative" class="text-slate-500 hover:text-red-600 hover:underline decoration-2 underline-offset-4 transition-all flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full bg-red-500"></span> 指定反方先
                        </button>
                    </div>
                </div>`;
        } else {
            // 決定階段類型圖示和顏色
            let stageIcon = '🎤';
            let stageColor = 'from-indigo-500 to-purple-500';
            if (stage.type === 'manual_prep') {
                stageIcon = '⏱️';
                stageColor = 'from-amber-500 to-orange-500';
            } else if (stage.type === 'announcement') {
                stageIcon = '📢';
                stageColor = 'from-blue-500 to-cyan-500';
            } else if (stage.type === 'free_debate') {
                stageIcon = '⚔️';
                stageColor = 'from-red-500 to-pink-500';
            }

            timerContent = `
                <div class="glass-panel hero-timer-card w-full flex-grow rounded-3xl ${timerStateClass}">
                    <!-- 階段標籤 -->
                    <div class="flex items-center justify-center gap-2 mb-4">
                        <span id="timerStatus" class="info-pill shadow-sm">${this.interpolateScript(stage.timerLabel || stage.name)}</span>
                    </div>
                    
                    <!-- 超大計時器數字 -->
                    <div id="timerDisplay" class="timer-digits text-[var(--text-main)]">${this.formatTime(timeLeft)}</div>
                    
                    <!-- 進度條 -->
                    <div class="progress-bg rounded-full overflow-hidden">
                        <div id="timerProgressBar" class="progress-fill rounded-full" style="width: ${progress}%"></div>
                    </div>
                    
                    <!-- 右下角功能按鈕組 -->
                    <div class="timer-action-btns">
                        <!-- PiP 畫中畫按鈕 -->
                        <button data-action="togglePip" class="timer-action-btn ${this.state.pip.isActive ? 'active' : ''}" aria-label="畫中畫模式" title="畫中畫模式">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                        </button>
                        <!-- 全螢幕按鈕 -->
                        <button data-action="togglePresentationMode" class="timer-action-btn" aria-label="全螢幕模式" title="全螢幕模式">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        }
        timerContainer.innerHTML = timerContent;

        // 階段講稿區
        const stageTypeLabel = {
            'speech_auto': '發言階段',
            'manual_prep': '準備時間',
            'announcement': '主席宣告',
            'choice_speech': '選擇階段',
            'free_debate': '自由辯論',
            'draw_rebuttal_order': '抽籤',
            'judge_comment': '裁判講評'
        };

        // 裁判講評階段：顯示特殊提示
        if (stage.type === 'judge_comment') {
            const judges = this.state.judges || ['裁判一', '裁判二', '裁判三'];
            const commentedCount = (this.state.judgeCommentOrder || []).length;
            const allDone = commentedCount >= judges.length;

            if (allDone) {
                // 所有裁判都講評完畢
                const orderedNames = this.state.judgeCommentOrder.map(i => judges[i]).join(' → ');
                stageContainer.innerHTML = `
                            <div class="glass-panel p-5 rounded-2xl relative overflow-hidden animate-scale-in">
                                <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50"></div>
                                <div class="flex flex-col gap-2 text-center">
                                    <div class="text-4xl mb-2">✅</div>
                                    <h3 class="font-bold text-lg text-[var(--text-main)] mb-2">裁判講評完畢</h3>
                                    <p class="text-slate-600 dark:text-slate-300 text-sm">講評順序：${orderedNames}</p>
                                </div>
                            </div>
                        `;
            } else if (this.state.currentJudge) {
                // 已選擇裁判，正在講評中
                const judge = this.state.currentJudge;
                const orderText = commentedCount === 1 ? '第一位' : (commentedCount === judges.length ? '最後一位' : `第 ${commentedCount} 位`);
                stageContainer.innerHTML = `
                            <div class="glass-panel p-5 rounded-2xl relative overflow-hidden animate-scale-in">
                                <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50"></div>
                                <div class="flex flex-col gap-2 text-center">
                                    <div class="text-4xl mb-2">🎓</div>
                                    <span class="text-[10px] font-bold text-violet-500 uppercase tracking-wider">裁判講評</span>
                                    <h3 class="font-bold text-xl text-violet-600 dark:text-violet-400 mb-2">${judge.name} 講評中</h3>
                                    <p class="text-slate-500 text-sm">講評順序：${orderText}（共 ${judges.length} 位裁判）</p>
                                </div>
                            </div>
                        `;
            } else {
                // 尚未選擇裁判
                stageContainer.innerHTML = `
                            <div class="glass-panel p-5 rounded-2xl relative overflow-hidden animate-scale-in">
                                <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50"></div>
                                <div class="flex flex-col gap-2 text-center">
                                    <div class="text-4xl mb-2">🎓</div>
                                    <span class="text-[10px] font-bold text-violet-500 uppercase tracking-wider">裁判講評</span>
                                    <h3 class="font-bold text-lg text-[var(--text-main)] mb-2">請選擇裁判講評順序</h3>
                                    <p class="text-slate-600 dark:text-slate-300 text-sm">共 ${judges.length} 位裁判等待講評</p>
                                </div>
                            </div>
                        `;
            }
        } else {
            stageContainer.innerHTML = `
                        <div class="glass-panel p-5 rounded-2xl relative overflow-hidden animate-scale-in">
                            <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-50"></div>
                            <div class="flex flex-col gap-2">
                                <div class="flex items-center gap-2 mb-1">
                                    <span class="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">${stageTypeLabel[stage.type] || '階段'}</span>
                                </div>
                                <h3 class="font-bold text-lg text-[var(--text-main)] mb-2">${this.interpolateScript(stage.name)}</h3>
                                <p class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">${this.interpolateScript(stage.script || stage.baseScript || '無講稿')}</p>
                            </div>
                        </div>
                    `;
        }

        this.renderDebateControls();
    },

    renderDebateControls() {
        const container = document.getElementById('debateControlsContainer');
        if (!container) return;

        const { timer, currentStageIndex, currentFlow, isAutoMode, recording, enableSpeech, pip } = this.state;
        const isPaused = timer.isPaused;
        const isRunning = !!(timer.interval || timer.graceInterval);
        const stage = currentFlow[currentStageIndex];
        const { isMicMuted, micAudioTrack } = recording;

        // --- 狀態判斷 ---
        const isReadyToStartManualPrep = (stage && stage.type === 'manual_prep' && timer.type !== 'manual_prep');
        const canForceStart = (stage && (stage.type === 'speech_auto' || stage.type === 'choice_speech') && timer.type === 'grace' && !this.state.mainSpeechTimerStartedByGrace);

        // 判斷是否為「無計時器」的環節
        let isNoTimerStage = !stage.duration && stage.type !== 'manual_prep';
        if (stage.type === 'draw_rebuttal_order') isNoTimerStage = true;
        if (stage.type === 'judge_comment') isNoTimerStage = true;

        // --- [新增] 判斷抽籤是否尚未完成 ---
        const isDrawNotCompleted = (stage && stage.type === 'draw_rebuttal_order' && !this.state.rebuttalOrder);

        // --- 主按鈕邏輯 ---
        let mainBtnAction = 'togglePause';
        let mainBtnIconType = (!isRunning || isPaused) ? 'play' : 'pause';
        let mainBtnLabel = (!isRunning || isPaused) ? '開始/繼續' : '暫停';
        let mainBtnClass = 'primary-play';
        let isMainBtnDisabled = false;

        // [NEW] 優先判斷是否正在朗讀 (若正在朗讀，允許玩家隨時開關)
        const isTtsActive = window.speechSynthesis && window.speechSynthesis.speaking;
        const isTtsPaused = window.speechSynthesis && window.speechSynthesis.paused;

        if (isTtsActive || isTtsPaused) {
            mainBtnIconType = isPaused ? 'play' : 'pause';
            mainBtnLabel = isPaused ? '繼續語音' : '暫停語音';
            mainBtnClass = 'primary-play';
            isMainBtnDisabled = false; // 強制解鎖按鈕
        } else if (isNoTimerStage) {
            isMainBtnDisabled = true;
            mainBtnIconType = 'play';
            mainBtnLabel = '此階段無計時';
            mainBtnClass += ' opacity-50 cursor-not-allowed grayscale';
        } else if (isReadyToStartManualPrep) {
            mainBtnAction = 'manualStartTimer';
            mainBtnIconType = 'play';
            mainBtnLabel = '開始準備計時';
            mainBtnClass = 'primary-play bg-amber-500 hover:bg-amber-600 ring-4 ring-amber-500/30 shadow-amber-500/50';
        }

        // --- 下一步按鈕禁用邏輯 ---
        // 如果計時器在跑 OR (是抽籤環節 且 還沒抽完)
        const nextBtnDisabled = (isRunning && !isPaused) || isDrawNotCompleted;
        const prevBtnDisabled = currentStageIndex <= 0 || (isRunning && !isPaused);

        const hasActiveHiddenFeatures = isAutoMode || enableSpeech || (pip && pip.isActive);

        const icons = {
            prev: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>`,
            next: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>`,
            play: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
            pause: `<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
            fastForward: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" /></svg>`,
            mic: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>`,
            micOff: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" stroke-dasharray="2 2" /><line x1="1" y1="1" x2="23" y2="23" /></svg>`,
            menu: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>`,
            close: `<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>`,
            pip: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>`,
            fullscreen: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>`,
            exitFullscreen: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" /></svg>`,
            projector: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" /></svg>`,
            reset: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>`,
            speech: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg>`,
            auto: `<span class="font-bold text-xs">AUTO</span>`,
            undo: `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>`
        };

        const isFullscreen = document.fullscreenElement || document.body.classList.contains('presentation-mode');
        const { projector } = this.state;

        container.innerHTML = `
            <div class="control-dock-wrapper">
                <div id="dockPopupMenu" class="dock-popup-menu">
                    <div class="menu-item-wrap"><button data-action="toggleAutoMode" class="dock-btn ${isAutoMode ? 'is-active' : ''}" aria-label="切換自動模式">${icons.auto}</button><span class="menu-label">自動</span></div>
                    <div class="menu-item-wrap"><button data-action="toggleSpeech" class="dock-btn ${enableSpeech ? 'is-active' : ''}" aria-label="切換語音朗讀">${icons.speech}</button><span class="menu-label">朗讀</span></div>
                    <div class="w-[1px] h-8 bg-white/10 mx-2 my-auto"></div>
                    <div class="menu-item-wrap"><button data-action="togglePip" class="dock-btn ${pip && pip.isActive ? 'is-active' : ''}" aria-label="開啟畫中畫">${icons.pip}</button><span class="menu-label">畫中畫</span></div>
                    <div class="menu-item-wrap"><button data-action="toggleProjectorMode" class="dock-btn ${projector && projector.isActive ? 'is-active' : ''}" aria-label="投影模式">${icons.projector}</button><span class="menu-label">投影</span></div>
                    <div class="menu-item-wrap"><button data-action="toggleFullscreen" class="dock-btn ${isFullscreen ? 'is-active' : ''}" aria-label="${isFullscreen ? '退出全螢幕' : '全螢幕'}">${isFullscreen ? icons.exitFullscreen : icons.fullscreen}</button><span class="menu-label">${isFullscreen ? '退出' : '全螢幕'}</span></div>
                    <div class="w-[1px] h-8 bg-white/10 mx-2 my-auto"></div>
                    <div class="menu-item-wrap"><button data-action="undo" class="dock-btn" aria-label="復原上一步">${icons.undo}</button><span class="menu-label">復原</span></div>
                    <div class="menu-item-wrap"><button data-action="resetDebate" class="dock-btn" style="color: #ef4444;" aria-label="重設所有進度">${icons.reset}</button><span class="menu-label text-red-400">重設</span></div>
                </div>

                <div class="main-dock-bar">
                    <button data-action="toggleMicMute" class="dock-btn ${isMicMuted ? 'is-active' : ''}" style="${isMicMuted ? 'color:#ef4444; background:rgba(239,68,68,0.1);' : ''}" ${!micAudioTrack ? 'disabled style="opacity:0.3"' : ''} aria-label="麥克風開關">
                        ${isMicMuted ? icons.micOff : icons.mic}
                    </button>

                    <button data-action="previousStage" class="dock-btn" ${prevBtnDisabled ? 'disabled style="opacity:0.3"' : ''} aria-label="上一階段">
                        ${icons.prev}
                    </button>

                    <button data-action="${mainBtnAction}" class="dock-btn ${mainBtnClass}" title="${mainBtnLabel}" aria-label="${mainBtnLabel}" ${isMainBtnDisabled ? 'disabled' : ''}>
                        ${icons[mainBtnIconType]}
                    </button>

                    ${canForceStart ?
                `<button data-action="forceStartMainTimer" class="dock-btn text-warning animate-scale-in" title="強制開始計時 (跳過準備)" aria-label="強制開始" style="color:#f59e0b; background:rgba(245,158,11,0.1);">
                            ${icons.fastForward}
                        </button>` : ''
            }

                    <button data-action="nextStage" class="dock-btn" ${nextBtnDisabled ? 'disabled style="opacity:0.3"' : ''} aria-label="下一階段">
                        ${icons.next}
                    </button>

                    <button id="dockMenuToggle" class="dock-btn ${hasActiveHiddenFeatures ? 'has-indicator' : ''}" aria-label="更多選項">
                        ${icons.menu}
                    </button>
                </div>
            </div>
        `;

        // 事件綁定 (保持不變)
        const toggleBtn = document.getElementById('dockMenuToggle');
        const menu = document.getElementById('dockPopupMenu');
        if (toggleBtn && menu) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                menu.classList.toggle('open');
                const isOpen = menu.classList.contains('open');
                toggleBtn.innerHTML = isOpen ? icons.close : icons.menu;
                if (hasActiveHiddenFeatures) toggleBtn.classList.toggle('has-indicator', !isOpen);
            });
            menu.addEventListener('click', (e) => {
                const btn = e.target.closest('button');
                if (btn) {
                    const action = btn.dataset.action;
                    if (['toggleFullscreen', 'resetDebate', 'undo'].includes(action)) {
                        menu.classList.remove('open');
                        toggleBtn.innerHTML = icons.menu;
                    }
                }
            });
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !toggleBtn.contains(e.target) && menu.classList.contains('open')) {
                    menu.classList.remove('open');
                    toggleBtn.innerHTML = icons.menu;
                    if (hasActiveHiddenFeatures) toggleBtn.classList.add('has-indicator');
                }
            }, { once: true });
        }
    },


    renderTranscriptionPanel() {
        const container = document.getElementById('transcriptionPanel');
        if (!container) return;

        const { active, paused } = this.state.transcription;
        const { isRecording, isPaused: isRecPaused, isAvailable, audioBlob, recordings } = this.state.recording;

        container.innerHTML = `
            <div class="flex flex-col h-full">
            <div class="flex flex-col border-b border-[var(--border-color)] bg-[var(--surface-2)] backdrop-blur-md sticky top-0 z-10 flex-shrink-0">
                
                <div class="px-4 py-3 flex justify-between items-center">
                    <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        <span class="font-bold text-sm">錄音與轉錄</span>
                        ${recordings.length > 0 ? `<span class="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">${recordings.length} 段</span>` : ''}
                    </div>
                    <div class="flex items-center gap-2">
                        ${recordings.length > 0 ? `<button data-action="openRecordingPlayer" class="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            播放錄音
                        </button>` : ''}
                        ${isRecording && !isRecPaused ? '<span class="text-xs font-mono text-red-500 animate-pulse flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-red-500"></span> REC</span>' : ''}
                        ${isRecording && isRecPaused ? '<span class="text-xs font-mono text-amber-500 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> 暫停</span>' : ''}
                    </div>
                </div>

                <div class="px-4 pb-3 flex gap-2">
                    ${!isRecording ? `
                        <button data-action="startRecording" 
                                ${!isAvailable ? 'disabled' : ''}
                                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
                            <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span> 開始錄音與轉錄
                        </button>
                    ` : `
                        <button data-action="${isRecPaused ? 'resumeRecording' : 'pauseRecording'}" 
                                class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${isRecPaused ? 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600'}">
                            ${isRecPaused ?
                `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> 繼續錄音` :
                `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg> 暫停錄音`}
                        </button>
                        <button data-action="stopRecording" 
                                class="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border bg-red-500 border-red-600 text-white shadow-inner hover:bg-red-600">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg> 停止
                        </button>
                    `}
                </div>
            </div>

            <div id="paragraphsContainer" class="flex-1 min-h-0 p-4 overflow-y-auto scroll-smooth space-y-4"></div>
            
            <div class="p-3 border-t border-[var(--border-color)] bg-[var(--surface-1)] text-sm min-h-[3.5rem] flex-shrink-0">
                <div class="flex">
                    <span class="text-[var(--color-primary)] font-mono mr-2">>></span>
                    <span id="interimContent" class="text-slate-500 italic">...</span>
                </div>
            </div>
            </div>
        `;

        this.renderTranscriptionParagraphs();
    },

    renderTranscriptionParagraphs() {
        const container = document.getElementById('paragraphsContainer');
        const interimEl = document.getElementById('interimContent');
        if (!container) return;

        // 如果沒有內容，顯示空狀態提示
        if (this.state.transcription.paragraphs.length === 0) {
            container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-slate-400 text-sm animate-fade-in-up opacity-60">
                        <svg class="w-12 h-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                        <p>等待發言...</p>
                    </div>`;
        } else {
            // 產生氣泡列表
            container.innerHTML = this.state.transcription.paragraphs.map(p => {
                const isPos = p.team === 'positive';
                const isNeg = p.team === 'negative';
                // 設定不同陣營的頭像顏色
                const avatarColor = isPos ? 'bg-green-500' : (isNeg ? 'bg-red-500' : 'bg-slate-500');

                return `
            <div class="flex gap-3 animate-fade-in-up group">
                            <div class="flex-shrink-0 w-8 h-8 rounded-full ${avatarColor} text-white flex items-center justify-center text-xs font-bold shadow-md mt-1 ring-2 ring-white dark:ring-slate-800">
                                ${p.speaker.charAt(0)}
                            </div>
                            <div class="flex-grow max-w-[85%]">
                                <div class="flex items-baseline justify-between mb-1 ml-1">
                                    <span class="text-xs font-bold text-slate-500 dark:text-slate-400">${p.speaker}</span>
                                </div>
                                <div class="chat-bubble text-sm leading-relaxed shadow-sm group-hover:shadow-md transition-shadow bg-white dark:bg-slate-700/50 dark:text-slate-200">
                                    ${p.content}
                                </div>
                            </div>
                        </div>
            `;
            }).join('');
        }

        // 更新底部即時文字
        if (interimEl) {
            interimEl.textContent = this.state.transcription.interimContent || (this.state.transcription.active ? '聆聽中...' : '...');
        }


        // 只有當使用者在底部附近時才自動滾動，避免閱讀時被打斷
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
        if (interimEl) {
            interimEl.textContent = this.state.transcription.interimContent;
        }

        container.scrollTop = container.scrollHeight;
    },

    renderModal({ title, body, footer }) {
        // --- [新增修復] 防止重複開啟 ---
        // 檢查畫面上是否已經有彈出視窗，如果有的話直接移除舊的
        const existingModal = document.querySelector('.modal-container');
        if (existingModal) {
            existingModal.remove();
        }
        // ------------------------
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.classList.contains('hidden')) {
            sidebar.classList.add('hidden');
        }

        const modal = document.createElement('div');
        modal.className = 'modal-container fixed inset-0 z-[110] flex items-center justify-center p-4';

        modal.innerHTML = `
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" data-action="closeModal"></div>
                <div class="relative glass-panel rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-scale-in border border-white/10">
                    <div class="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--surface-2)]">
                        <h3 class="font-bold text-xl text-[var(--text-main)]">${title}</h3>
                        <button data-action="closeModal" class="text-slate-400 hover:text-[var(--text-main)] transition-colors">
                            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    <div class="p-6 max-h-[70vh] overflow-y-auto text-[var(--text-main)]">${body}</div>
                    ${footer ? `<div class="p-4 modal-footer flex justify-end gap-3 bg-[var(--surface-1)] border-t border-[var(--border-color)]">${footer}</div>` : ''}
                </div>`;

        document.body.appendChild(modal);
    },
    showPromotionModal() {
        const modalBody = `
                <div>
                    <p class="mb-4 text-slate-600 dark:text-slate-300">
                        想要在辯論活動中使用辯時計或贊助開發者嗎?或是在辯時計中投放廣告嗎?歡迎諮詢開發者!
                    </p>
                    
                    <img src="de77da3f-30cf-4be3-b837-1c4c22e9d599.jpg" alt="宣傳內容" class="w-full rounded-lg shadow-md">
                    
                    <p class="mt-4 text-xs text-slate-500">
                        想了解更多功能嗎？點擊右上角選單探索或查看快捷鍵說明！
                    </p>
                </div>
        `;

        this.renderModal({
            title: '🎉 歡迎來到辯時計 Pro 🎉',
            body: modalBody,
            footer: `<button data-action="closeModal" class="px-6 py-2 rounded-lg text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">開始使用</button>`
        });
    },
    renderEditorView() {
        // 優先使用已保存的賽制名稱，否則透過流程內容反查
        const originalFormatName = this.state.selectedFormat || this.findFormatNameByFlow(this.state.originalFlowBeforeEdit) || '自訂流程';

        // 計算流程統計資訊
        const totalDuration = this.state.currentFlow.reduce((sum, s) => sum + (s.duration || 0), 0);
        const stageCount = this.state.currentFlow.length;
        const formatDuration = (sec) => {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return m > 0 ? `${m} 分 ${s > 0 ? s + ' 秒' : ''} ` : `${s} 秒`;
        };

        // 建立流程選擇器的選項
        const buildFlowOptions = () => {
            let options = '<option value="CUSTOM_EMPTY">📄 建立空白流程</option>';
            for (const groupName in this.debateFormatGroups) {
                const formats = this.debateFormatGroups[groupName];
                if (Object.keys(formats).length === 0) continue;
                options += `<optgroup label="${groupName}">`;
                for (const formatName in formats) {
                    const isSelected = formatName === originalFormatName ? 'selected' : '';
                    options += `<option value="${formatName}" ${isSelected}>${formatName}</option>`;
                }
                options += '</optgroup>';
            }
            return options;
        };

        this.mainContent.innerHTML = `
            <div class="max-w-3xl mx-auto pb-40 animate-fade-in-up px-4">
                    
                    <!--編輯器頂部面板 -->
                    <div class="editor-top-panel glass-panel mb-6 mt-4 p-5 rounded-2xl">
                        <div class="flex flex-col md:flex-row md:items-center gap-4">
                            <!-- 左側：流程選擇 -->
                            <div class="flex-1">
                                <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                    切換流程範本
                                </label>
                                <select id="editor-flow-selector" data-change-action="switchEditorFlow" class="form-element w-full p-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--surface-2)] text-sm font-medium cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                                    ${buildFlowOptions()}
                                </select>
                            </div>
                            
                            <!-- 右側：流程統計 -->
                            <div class="flex gap-4 md:gap-6">
                                <div class="text-center px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
                                    <div class="text-2xl font-bold text-[var(--color-primary)]" id="editor-stage-count">${stageCount}</div>
                                    <div class="text-xs text-slate-500">階段數</div>
                                </div>
                                <div class="text-center px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border-color)]">
                                    <div class="text-lg font-bold text-[var(--color-accent)]" id="editor-total-duration">${totalDuration > 0 ? formatDuration(totalDuration) : '--'}</div>
                                    <div class="text-xs text-slate-500">預估總時間</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!--流程名稱輸入 -->
                    <div class="mb-6">
                        <label class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1 mb-2 block flex items-center gap-2">
                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            流程名稱
                        </label>
                        <div class="relative">
                            <input id="editor-flow-name" 
                                class="editor-header-input w-full text-xl font-bold px-4 py-3 rounded-xl border-2 border-transparent bg-[var(--surface-2)] focus:border-[var(--color-primary)] focus:bg-[var(--surface-1)] transition-all" 
                                value="${originalFormatName}" 
                                placeholder="請輸入流程名稱...">
                            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </div>
                        </div>
                    </div>

                    <!--階段列表標題 -->
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                            <svg class="w-4 h-4 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                            流程階段
                        </h3>
                        <span class="text-xs text-slate-400 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                            拖曳排序
                        </span>
                    </div>

                    <div class="space-y-3">
                        <div id="editor-stage-list" class="min-h-[200px]">
                        </div>
                        
                        <button data-action="addStage" class="add-stage-area w-full group mt-6">
                            <div class="btn-add-stage">
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center group-hover:from-[var(--color-primary)] group-hover:to-[var(--color-primary-dark)] group-hover:text-white transition-all shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-500/20">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                </div>
                                <span class="font-medium">新增一個階段...</span>
                            </div>
                        </button>
                    </div>
                </div>

                <!--底部操作列 -->
            <div class="editor-sticky-bar animate-fade-in-up">
                <div class="flex items-center gap-3">
                    <button data-action="closeEditor" class="px-4 py-2.5 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-semibold text-sm flex items-center gap-2 border border-transparent hover:border-red-200 dark:hover:border-red-800">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        捨棄
                    </button>
                </div>

                <div class="flex items-center gap-3">
                    <div id="editor-unsaved-indicator" class="hidden items-center gap-1.5 text-xs text-amber-500 font-medium px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        未儲存
                    </div>
                    <button data-action="saveAndCloseEditor" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] hover:from-[var(--color-primary-dark)] hover:to-[var(--color-accent-hover)] text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all font-bold text-sm flex items-center gap-2 transform hover:scale-105 active:scale-95">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                        儲存流程
                    </button>
                </div>
            </div>
        `;
        this.renderEditorStageList();
        this.updateEditorUnsavedIndicator();
    },

    renderEditorStageList() {
        const container = document.getElementById('editor-stage-list');
        if (!container) return;

        // 定義美觀的圖示與顏色
        const stageConfig = {
            announcement: { icon: '📢', color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-200 dark:border-blue-800', label: '公告' },
            draw_rebuttal_order: { icon: '🎲', color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-200 dark:border-purple-800', label: '抽籤' },
            manual_prep: { icon: '⏱️', color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', label: '手動準備' },
            speech_auto: { icon: '🎤', color: 'text-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', borderColor: 'border-indigo-200 dark:border-indigo-800', label: '自動計時' },
            choice_speech: { icon: '🗣️', color: 'text-pink-500', bgColor: 'bg-pink-50 dark:bg-pink-900/20', borderColor: 'border-pink-200 dark:border-pink-800', label: '選擇發言' },
            free_debate: { icon: '⚖️', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800', label: '自由辯論' },
            default: { icon: '⚙️', color: 'text-slate-500', bgColor: 'bg-slate-50 dark:bg-slate-800', borderColor: 'border-slate-200 dark:border-slate-700', label: '一般' }
        };

        // 格式化時間顯示
        const formatDuration = (sec) => {
            if (!sec) return null;
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            if (m > 0 && s > 0) return `${m}分${s} 秒`;
            if (m > 0) return `${m} 分鐘`;
            return `${s} 秒`;
        };

        if (this.state.currentFlow.length === 0) {
            container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 border-2 border-dashed border-[var(--border-color)] rounded-2xl bg-gradient-to-br from-[var(--surface-1)] to-[var(--surface-2)]">
                        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mb-4 text-4xl shadow-lg">📝</div>
                        <h3 class="text-lg font-bold text-slate-600 dark:text-slate-300">流程是空的</h3>
                        <p class="text-slate-500 text-sm mt-1">點擊下方按鈕開始建立您的辯論流程</p>
                    </div>
            `;
        } else {
            container.innerHTML = this.state.currentFlow.map((stage, index) => {
                const config = stageConfig[stage.type] || stageConfig.default;
                const durationFormatted = formatDuration(stage.duration);
                const durationText = durationFormatted
                    ? `<span class="font-semibold">${durationFormatted}</span>`
                    : '<span class="text-slate-400 text-xs italic">無時限</span>';

                return `
            <div data-index="${index}" class="timeline-card group animate-fade-in-up" style="animation-delay: ${index * 40}ms">
                        <div class="card-drag-handle" title="拖曳排序">
                            <div class="flex flex-col items-center gap-1">
                                <svg class="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" /></svg>
                                <span class="text-[10px] font-bold opacity-60">${index + 1}</span>
                            </div>
                        </div>
                        
                        <div class="card-content">
                            <div class="card-icon-box ${config.bgColor} ${config.borderColor} border">
                                <span class="text-lg">${config.icon}</span>
                            </div>
                            
                            <div class="card-info flex-grow min-w-0">
                                <h4 class="truncate text-[15px]">${stage.name || '未命名階段'}</h4>
                                <div class="flex flex-wrap items-center gap-2 mt-1">
                                    <span class="mini-tag ${config.color}">${config.label}</span>
                                    <span class="text-xs text-slate-400 flex items-center gap-1">
                                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        ${durationText}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="card-actions">
                            <button data-action="editStage" data-index="${index}" class="icon-btn" title="編輯階段">
                                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button data-action="deleteStage" data-index="${index}" class="icon-btn delete" title="刪除階段">
                                <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
            `;
            }).join('');
        }

        // 重置 Sortable
        if (this.state.sortableInstance) {
            this.state.sortableInstance.destroy();
        }

        if (typeof Sortable !== 'undefined') {
            const listEl = container;
            this.state.sortableInstance = Sortable.create(listEl, {
                animation: 150,
                handle: '.card-drag-handle', // 指定只能抓把手
                ghostClass: 'sortable-ghost',
                dragClass: 'sortable-drag',
                onEnd: (evt) => {
                    const { oldIndex, newIndex } = evt;
                    if (oldIndex === newIndex) return;
                    const [movedItem] = this.state.currentFlow.splice(oldIndex, 1);
                    this.state.currentFlow.splice(newIndex, 0, movedItem);
                    // 這裡不重新渲染，保持 DOM 穩定，因為 Sortable 已經移動了 DOM
                    // 但為了更新 index 屬性，我們還是建議重新渲染，或者您可以只更新資料
                    this.renderEditorStageList();
                },
            });
        }

        // 更新未儲存指示器
        this.updateEditorUnsavedIndicator();
    },

    // 插入變數到指定的 textarea
    insertVariable(button) {
        const variable = button.dataset.variable;
        const targetId = button.dataset.target;
        const textarea = document.getElementById(targetId);

        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        // 在游標位置插入變數
        textarea.value = text.substring(0, start) + variable + text.substring(end);

        // 將游標移到插入的變數之後
        const newCursorPos = start + variable.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
    },

    renderStageEditorModal(stage = {}, index = NaN) {
        const isNew = isNaN(index);
        const title = isNew ? '新增階段' : `編輯階段: ${stage.name} `;

        const current = { name: '', type: 'announcement', duration: '', script: '', timerLabel: '', graceDuration: 60, graceEndAction: 'auto_start', choosingTeam: 'positive', actionChoices: '', baseScript: '', baseTimerLabel: '', ...stage };
        const typeOptions = [
            { value: 'announcement', text: '📢 公告/提示' },
            { value: 'draw_rebuttal_order', text: '🎲 結辯順序抽籤' },
            { value: 'manual_prep', text: '⏱️ 手動準備計時' },
            { value: 'speech_auto', text: '🎤 自動發言計時' },
            { value: 'choice_speech', text: '🗣️ 辯革盃發言' },
            { value: 'free_debate', text: '⚖️ 自由辯論' },
            { value: 'judge_comment', text: '🎓 裁判講評' },
        ];

        const formFields = `
            <input type="hidden" name="index" value="${index}">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">階段名稱</label>
                        <input name="name" type="text" required class="form-element w-full p-2 border rounded-md" value="${current.name}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">階段類型</label>
                        <select name="type" id="stageTypeSelector" class="form-element w-full p-2 border rounded-md">
                            ${typeOptions.map(opt => `<option value="${opt.value}" ${current.type === opt.value ? 'selected' : ''}>${opt.text}</option>`).join('')}
                        </select>
                    </div>
                    <div id="dynamic-fields-container" class="space-y-4"></div>
                </div>`;

        this.renderModal({
            title,
            body: `<form id="stage-editor-form" class="p-1 pr-2">${formFields}</form>`,
            footer: `
                <button data-action="closeModal" class="btn-secondary px-4 py-2 rounded-lg">取消</button>
                <button data-action="saveStage" class="px-4 py-2 rounded-lg text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]">儲存</button>
        `
        });

        const typeSelector = document.getElementById('stageTypeSelector');

        // --- 核心修改在此：renderDynamicFields 函式 ---
        const renderDynamicFields = (type) => {
            const container = document.getElementById('dynamic-fields-container');
            let html = '';
            const inputClasses = "form-element w-full p-2 border rounded-md";

            // 變數標籤 HTML 生成函式
            const renderVariableTags = (textareaId) => {
                const numNames = ['一', '二', '三', '四', '五', '六'];
                const playerCount = App.state.positiveTeamPlayers.length;

                // 基本變數
                const variables = [
                    { key: '{{debate_topic}}', label: '辯題', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
                    { key: '{{positive_team_name}}', label: '正方隊名', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
                    { key: '{{negative_team_name}}', label: '反方隊名', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
                ];

                // 動態新增正方選手變數
                for (let i = 0; i < playerCount; i++) {
                    variables.push({
                        key: `{ {positive_player_${i + 1} } } `,
                        label: `正${numNames[i] || (i + 1)} `,
                        color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    });
                }

                // 動態新增反方選手變數
                for (let i = 0; i < playerCount; i++) {
                    variables.push({
                        key: `{ {negative_player_${i + 1} } } `,
                        label: `反${numNames[i] || (i + 1)} `,
                        color: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                    });
                }

                // 結辯順序和辯革盃變數
                variables.push(
                    { key: '{{first_rebuttal_team_name}}', label: '先結辯方', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
                    { key: '{{second_rebuttal_team_name}}', label: '後結辯方', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
                    { key: '{{selected_action_type}}', label: '環節選擇(辯革盃)', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' }
                );

                return `
            <div class="flex flex-wrap gap-1.5 mb-2">
                <span class="text-xs text-slate-500 mr-1 self-center">點擊插入：</span>
                                ${variables.map(v => `
                                    <button type="button" 
                                        class="variable-tag px-2 py-0.5 rounded text-xs font-medium ${v.color} hover:opacity-80 transition-opacity cursor-pointer"
                                        data-variable="${v.key}"
                                        data-target="${textareaId}"
                                        onclick="App.insertVariable(this)">
                                        ${v.label}
                                    </button>
                                `).join('')
                    }
                            </div>
            `;
            };

            // 建立一個區塊的函式，方便重複使用
            const createSection = (title, content) => {
                return `
            <div class="border-t border-[var(--border-color)] pt-4 mt-4">
                            <h4 class="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">${title}</h4>
                            <div class="space-y-4">${content}</div>
                        </div>
            `;
            };

            let mainSettings = '';
            let graceSettings = '';
            let choiceSettings = '';

            // 1. 收集主要設定
            if (['manual_prep', 'speech_auto', 'choice_speech', 'free_debate'].includes(type)) {
                mainSettings += `<div ><label class="block text-sm font-medium mb-1">主要時間 (秒)</label><input name="duration" type="number" class="${inputClasses}" value="${current.duration || ''}"></div>`;
            }
            if (['manual_prep', 'speech_auto'].includes(type)) {
                mainSettings += `<div ><label class="block text-sm font-medium mb-1">計時器標籤</label><input name="timerLabel" type="text" class="${inputClasses}" value="${current.timerLabel || ''}"></div>`;
            }
            if (!['choice_speech', 'judge_comment'].includes(type)) {
                mainSettings += `
            <div >
            <label class="block text-sm font-medium mb-1">主持人講稿</label>
                                ${renderVariableTags('script-textarea')}
        <textarea name="script" id="script-textarea" rows="4" class="${inputClasses}" placeholder="輸入講稿，可點擊上方標籤插入變數...">${current.script || ''}</textarea>
                            </div> `;
            }

            // 裁判講評特別說明
            if (type === 'judge_comment') {
                mainSettings += `
            <div class="bg-violet-50 dark:bg-violet-900/20 p-3 rounded-lg text-sm text-violet-700 dark:text-violet-300">
                <p class="flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    裁判講評不設計時器。進入此階段時，系統會彈出選擇視窗讓您選擇講評裁判的順序。
                </p>
                            </div> `;
            }

            // 2. 收集緩衝期設定
            if (type === 'speech_auto' || type === 'choice_speech') {
                graceSettings += `<div ><label class="block text-sm font-medium mb-1">語音緩衝期 (秒)</label><input name="graceDuration" type="number" class="${inputClasses}" value="${current.graceDuration || ''}"></div>`;
                graceSettings += `<div ><label class="block text-sm font-medium mb-1">緩衝期結束動作</label><select name="graceEndAction" class="${inputClasses}"><option value="auto_start" ${current.graceEndAction === 'auto_start' ? 'selected' : ''}>自動開始</option><option value="manual_start" ${current.graceEndAction === 'manual_start' ? 'selected' : ''}>手動開始</option><option value="auto_skip" ${current.graceEndAction === 'auto_skip' ? 'selected' : ''}>自動跳過</option></select></div> `;
            }

            // 3. 收集辯革盃發言設定
            if (type === 'choice_speech') {
                choiceSettings += `<div ><label class="block text-sm font-medium mb-1">選擇方</label><select name="choosingTeam" class="${inputClasses}"><option value="positive" ${current.choosingTeam === 'positive' ? 'selected' : ''}>正方</option><option value="negative" ${current.choosingTeam === 'negative' ? 'selected' : ''}>反方</option></select></div> `;
                choiceSettings += `<div ><label class="block text-sm font-medium mb-1">可選動作 (以逗號分隔)</label><input name="actionChoices" type="text" class="${inputClasses}" value="${Array.isArray(current.actionChoices) ? current.actionChoices.join(', ') : ''}"></div>`;
                choiceSettings += `
            <div>
            <label class="block text-sm font-medium mb-1">基礎講稿樣板</label>
                                ${renderVariableTags('baseScript-textarea')}
        <textarea name="baseScript" id="baseScript-textarea" rows="3" class="${inputClasses}" placeholder="例：請 {{choosingTeam}} 辯士上台進行 {{selected_action_type}}">${current.baseScript || ''}</textarea>
                            </div> `;
                choiceSettings += `<div ><label class="block text-sm font-medium mb-1">基礎計時器標籤樣板</label><input name="baseTimerLabel" type="text" class="${inputClasses}" placeholder="例：{{choosingTeam}} {{selected_action_type}}" value="${current.baseTimerLabel || ''}"></div>`;
            }

            // 4. 組合區塊
            if (mainSettings) html += createSection('主要設定', mainSettings);
            if (graceSettings) html += createSection('緩衝期設定', graceSettings);
            if (choiceSettings) html += createSection('辯革盃發言設定', choiceSettings);

            container.innerHTML = html;
        };

        typeSelector.addEventListener('change', (e) => renderDynamicFields(e.target.value));
        renderDynamicFields(current.type); // Initial render

        // Enter 鍵儲存功能（排除 textarea）
        const form = document.getElementById('stage-editor-form');
        if (form) {
            form.addEventListener('keydown', (e) => {
                // 如果按下 Enter 且不是在 textarea 中
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    App.actions.saveStage();
                }
            });
        }
    },

    renderHeader() {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            const isDark = document.documentElement.classList.contains('dark');
            themeBtn.innerHTML = isDark
                ? `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`
                : `<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21c3.93 0 7.403-2.126 9.002-5.248z" /></svg>`;
        }
    },
    renderPromotionArea() {
        return `
            <div class="mt-12 p-6 sm:p-8 rounded-2xl promo-card">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div class="md:col-span-2">
                        <h3 class="text-xl font-bold mb-2">探索「辯時計」的更多可能</h3>
                        <p class="text-slate-600 mb-4 text-sm">
                            感謝您使用本系統！我們致力於提供最專業的辯論計時體驗。點擊下方按鈕與我們合作或贊助我們的開發。
                        </p>
                        <a href="#" data-action="showPremiumModal" class="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-colors shadow">
                            了解更多
                        </a>
                    </div>
                </div>
                </div>
            `;
    },
    renderSidebar() {
        const sidebarPanel = document.getElementById('sidebar-panel');
        if (!sidebarPanel) return;

        const { isAutoMode, enableSpeech } = this.state;
        const isDark = document.documentElement.classList.contains('dark');

        const renderToggle = (label, action, checked, icon) => `
            <div class="menu-item" onclick="document.querySelector('input[data-change-action=\\'${action}\\']').click()">
                    <div class="menu-toggle-wrapper">
                        <div class="menu-icon">${icon}</div>
                        <span class="font-semibold text-sm">${label}</span>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer" onclick="event.stopPropagation()">
                        <input type="checkbox" ${checked ? 'checked' : ''} data-change-action="${action}" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                </div>
            `;

        const renderAction = (label, action, icon, subtext = '') => `
            <button data-action="${action}" class="menu-item w-full text-left group">
                    <div class="menu-toggle-wrapper">
                        <div class="menu-icon group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">${icon}</div>
                        <div class="flex flex-col">
                            <span class="font-semibold text-sm">${label}</span>
                            ${subtext ? `<span class="text-xs text-slate-500">${subtext}</span>` : ''}
                        </div>
                    </div>
                    <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            `;

        sidebarPanel.innerHTML = `
            <div class="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--surface-1)] rounded-t-[1.5rem] md:rounded-none sticky top-0 z-10">
                    <div><h2 class="font-bold text-xl">控制中心</h2><p class="text-xs text-slate-500">Control Center</p></div>
                    
                    <button data-action="toggleSidebar" class="sidebar-close-btn p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div class="p-6 overflow-y-auto flex-grow space-y-6">
                    <div class="premium-card cursor-pointer" data-action="showPremiumModal">
                        <div class="premium-card-icon">
                            <svg class="w-8 h-8 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </div>
                        <div class="premium-card-content">
                            <h3>升級 Premium</h3>
                            <p>解鎖更多專業功能</p>
                        </div>
                        <div class="premium-card-arrow">
                            <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </div>
                    </div>

                    <button data-action="restartTour" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition-all font-semibold text-sm">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                        開始教學
                    </button>

                    <div class="menu-group-divider"></div>

                    <div>
                        <div class="menu-group-title">比賽設定</div>
                        <div class="menu-item" onclick="document.querySelector('input[data-change-action=\\'toggleAutoMode\\']').click()">
                            <div class="menu-toggle-wrapper">
                                <div class="menu-icon menu-icon--blue"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                                <span class="font-semibold text-sm">自動模式</span>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer" onclick="event.stopPropagation()">
                                <input type="checkbox" ${isAutoMode ? 'checked' : ''} data-change-action="toggleAutoMode" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all toggle-switch dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                            </label>
                        </div>
                        <div class="menu-item" onclick="document.querySelector('input[data-change-action=\\'toggleSpeech\\']').click()">
                            <div class="menu-toggle-wrapper">
                                <div class="menu-icon menu-icon--blue"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></svg></div>
                                <span class="font-semibold text-sm">語音朗讀</span>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer" onclick="event.stopPropagation()">
                                <input type="checkbox" ${enableSpeech ? 'checked' : ''} data-change-action="toggleSpeech" class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all toggle-switch dark:border-gray-600 peer-checked:bg-[var(--color-primary)]"></div>
                            </label>
                        </div>
                    </div>

                    <div class="menu-group-divider"></div>

                    <div>
                        <div class="menu-group-title">顯示與外觀</div>
                        <button data-action="toggleTheme" class="menu-item w-full text-left group">
                            <div class="menu-toggle-wrapper">
                                <div class="menu-icon menu-icon--purple group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">${isDark ? `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>` : `<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>`}</div>
                                <div class="flex flex-col">
                                    <span class="font-semibold text-sm">切換主題</span>
                                    <span class="text-xs text-slate-500">${isDark ? '目前：深色模式' : '目前：淺色模式'}</span>
                                </div>
                            </div>
                            <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                        <button data-action="toggleFullscreen" class="menu-item w-full text-left group">
                            <div class="menu-toggle-wrapper">
                                <div class="menu-icon menu-icon--purple group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg></div>
                                <div class="flex flex-col">
                                    <span class="font-semibold text-sm">全螢幕模式</span>
                                    <span class="text-xs text-slate-500">比賽中將自動隱藏介面</span>
                                </div>
                            </div>
                            <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                        <button data-action="toggleProjectorMode" class="menu-item w-full text-left group">
                            <div class="menu-toggle-wrapper">
                                <div class="menu-icon menu-icon--purple group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z" /></svg></div>
                                <div class="flex flex-col">
                                    <span class="font-semibold text-sm">投影模式</span>
                                    <span class="text-xs text-slate-500">開啟外接螢幕顯示視窗</span>
                                </div>
                            </div>
                            <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div class="menu-group-divider"></div>

                    <div>
                        <div class="menu-group-title">系統</div>
                        <button data-action="showShortcutHelp" class="menu-item w-full text-left group">
                            <div class="menu-toggle-wrapper">
                                <div class="menu-icon menu-icon--gray group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                                <span class="font-semibold text-sm">快捷鍵說明</span>
                            </div>
                            <svg class="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                        <button data-action="resetDebate" class="menu-item w-full text-left group border-red-500/20">
                            <div class="menu-toggle-wrapper text-red-500">
                                <div class="menu-icon bg-red-500/10 group-hover:bg-red-500 group-hover:text-white transition-colors"><svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></div>
                                <span class="font-bold">重設辯論系統</span>
                            </div>
                        </button>
                    </div>
                </div>
                <div class="p-4 text-center text-xs text-slate-500 border-t border-[var(--border-color)]">辯時計 2.3 <br> 技術，為了更好的思辯</div>
        `;
    },

    // --- SPEECH & SOUND ---
    initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.synth = window.speechSynthesis;
            const loadVoices = () => {
                this.voices = this.synth.getVoices().filter(v => v.lang.startsWith('zh-TW') || v.lang.startsWith('zh'));
            };

            if (this.synth.onvoiceschanged !== undefined) {
                this.synth.onvoiceschanged = loadVoices;
            }
            loadVoices();
        }
    },

    // --- 投影模式 (Projector Mode) ---
    initProjectorChannel() {
        if ('BroadcastChannel' in window) {
            // 如果已經有 channel，先清理
            if (this.state.projector.channel) {
                try { this.state.projector.channel.close(); } catch (e) { }
            }

            try {
                this.state.projector.channel = new BroadcastChannel('debate-timer-sync');
                console.log('[Projector] BroadcastChannel initialized');

                // 監聽來自顯示視窗的訊息
                this.state.projector.channel.onmessage = (event) => {
                    console.log('[Projector] Received:', event.data?.type);
                    if (event.data && event.data.type === 'DISPLAY_CONNECTED') {
                        // 頁面重載後，若投影視窗仍在運行，自動重新啟用投影模式
                        if (!this.state.projector.isActive) {
                            this.state.projector.isActive = true;
                            this.state.projector.mode = 'window';
                            console.log('[Projector] Display reconnected!');
                            this.showNotification('投影視窗已重新連接', 'success', 2000);
                        }
                        // 發送當前狀態
                        this.sendProjectorUpdate();
                    }
                };

                // 清除舊的心跳
                if (this.state.projector.heartbeatInterval) {
                    clearInterval(this.state.projector.heartbeatInterval);
                }

                // 定期發送心跳
                this.state.projector.heartbeatInterval = setInterval(() => {
                    if (this.state.projector.isActive && this.state.projector.channel) {
                        try {
                            this.state.projector.channel.postMessage({ type: 'HEARTBEAT' });
                        } catch (e) {
                            console.warn('[Projector] Heartbeat failed:', e);
                        }
                    }
                }, 2000);

                // 主動廣播 CONTROLLER_READY，讓已開啟的 display 知道我們已準備好
                setTimeout(() => {
                    if (this.state.projector.channel) {
                        try {
                            this.state.projector.channel.postMessage({ type: 'CONTROLLER_READY' });
                            console.log('[Projector] Sent CONTROLLER_READY');
                        } catch (e) { }
                    }
                }, 300);

            } catch (e) {
                console.error('[Projector] Failed to create BroadcastChannel:', e);
            }
        } else {
            console.warn('[Projector] BroadcastChannel not supported');
        }
    },

    sendProjectorUpdate() {
        // 如果投影模式未啟用，不發送更新
        if (!this.state.projector.isActive) {
            return;
        }

        // 如果 channel 不存在，嘗試重新初始化
        if (!this.state.projector.channel) {
            this.initProjectorChannel();
            // 如果仍然無法初始化，靜默返回
            if (!this.state.projector.channel) {
                return;
            }
        }

        const timer = this.state.timer || { timeLeft: 0, initialDuration: 0, isPaused: false, type: null, interval: null, graceInterval: null };
        const currentFlow = this.state.currentFlow;
        const currentStageIndex = this.state.currentStageIndex || 0;
        const stage = currentFlow && currentFlow[currentStageIndex];

        // 取得當前階段名稱
        let currentStageName = '準備中';
        if (stage && (stage.timerLabel || stage.name)) {
            currentStageName = this.interpolateScript(stage.timerLabel || stage.name || '');
        }

        // 判斷是否時間到 (只有在計時器啟動的情況下才判斷)
        const isTimesUp = timer.type !== null && timer.timeLeft <= 0 && !timer.isPaused;

        // 判斷是否在寬限時間
        const isGracePeriod = timer.type === 'grace';

        // 判斷是否在自由辯論模式
        const isFreeDebate = stage && stage.type === 'free_debate' && this.state.freeDebate.activeTeam;

        // 根據模式決定時間和狀態
        let payloadTimeRemaining, payloadTotalTime, payloadIsRunning, payloadIsPaused, payloadStageName;

        if (isFreeDebate) {
            const { freeDebate } = this.state;
            const activeTeam = freeDebate.activeTeam;
            payloadTimeRemaining = activeTeam === 'positive' ? freeDebate.positiveTimeLeft : freeDebate.negativeTimeLeft;
            payloadTotalTime = freeDebate.initialDuration || 0;
            payloadIsRunning = !freeDebate.isPaused && !!freeDebate.interval;
            payloadIsPaused = freeDebate.isPaused;
            payloadStageName = activeTeam === 'positive'
                ? `${this.state.positiveTeamName || '正方'} 發言中`
                : `${this.state.negativeTeamName || '反方'} 發言中`;
        } else {
            payloadTimeRemaining = timer.timeLeft || 0;
            payloadTotalTime = timer.initialDuration || 0;
            payloadIsRunning = !!(timer.interval || timer.graceInterval);
            payloadIsPaused = timer.isPaused || false;
            payloadStageName = currentStageName;
        }

        try {
            // 準備辯手資料
            const positiveDebaters = (this.state.positiveTeamPlayers || []).map((name, idx) => ({
                position: ['一辯', '二辯', '三辯', '四辯'][idx] || `${idx + 1} 辯`,
                name: name || '',
                isClosing: idx === this.state.positiveClosingIndex
            }));

            const negativeDebaters = (this.state.negativeTeamPlayers || []).map((name, idx) => ({
                position: ['一辯', '二辯', '三辯', '四辯'][idx] || `${idx + 1} 辯`,
                name: name || '',
                isClosing: idx === this.state.negativeClosingIndex
            }));

            this.state.projector.channel.postMessage({
                type: 'TIMER_UPDATE',
                payload: {
                    timeRemaining: payloadTimeRemaining,
                    isRunning: payloadIsRunning,
                    currentStage: payloadStageName,
                    totalTime: payloadTotalTime,
                    isTimesUp: isTimesUp,
                    isGracePeriod: isGracePeriod,
                    gracePeriodRemaining: isGracePeriod ? timer.timeLeft : 0,
                    gracePeriodTotal: isGracePeriod ? timer.initialDuration : 0,
                    isPaused: payloadIsPaused,
                    // 辯手資料
                    positiveTeamName: this.state.positiveTeamName || '',
                    negativeTeamName: this.state.negativeTeamName || '',
                    positiveDebaters: positiveDebaters,
                    negativeDebaters: negativeDebaters,
                    // 結辯索引
                    positiveClosingIndex: this.state.positiveClosingIndex,
                    negativeClosingIndex: this.state.negativeClosingIndex,
                    // 正式賽模式資料
                    tournamentName: this.state.tournamentName || '',
                    debateTopic: this.state.debateTopic || '',
                }
            });
            console.log('Projector update sent:', currentStageName);
        } catch (e) {
            console.warn('Failed to send projector update:', e);
        }
    },

    async startProjectorMode() {
        // 先確保 BroadcastChannel 已初始化
        if (!this.state.projector.channel) {
            this.initProjectorChannel();
        }

        // 使用 window.open 雙視窗法
        // 注意：Presentation API 在部分瀏覽器上會導致崩潰，故不使用
        if (window.open) {
            try {
                const displayWindow = window.open(
                    'display.html',
                    'DebateTimerDisplay',
                    'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
                );

                if (displayWindow) {
                    this.state.projector.displayWindow = displayWindow;
                    this.state.projector.isActive = true;
                    this.state.projector.mode = 'window';

                    // 監聽視窗關閉 (儲存 interval ID 以便清除)
                    if (this.state.projector.windowCheckInterval) {
                        clearInterval(this.state.projector.windowCheckInterval);
                    }
                    this.state.projector.windowCheckInterval = setInterval(() => {
                        if (displayWindow.closed) {
                            this.state.projector.displayWindow = null;
                            this.state.projector.isActive = false;
                            this.state.projector.mode = null;
                            clearInterval(this.state.projector.windowCheckInterval);
                            this.state.projector.windowCheckInterval = null;
                        }
                    }, 1000);

                    this.showNotification('投影視窗已開啟，請將視窗拖曳至外接螢幕並按 F11 全螢幕', 'success', 5000);

                    // 稍後發送初始狀態
                    setTimeout(() => this.sendProjectorUpdate(), 500);
                    return;
                }
            } catch (e) {
                console.log('window.open 失敗', e);
            }
        }

        // 3. 兩種方法都不支援
        this.renderModal({
            title: '投影模式不可用',
            body: `
            <div class="text-center space-y-4">
                            <div class="text-5xl">📺</div>
                            <p class="text-slate-600 dark:text-slate-300">
                                您的瀏覽器不支援投影模式功能。
                            </p>
                            <div class="text-sm text-slate-500 space-y-2">
                                <p><strong>建議方案：</strong></p>
                                <ul class="list-disc list-inside text-left">
                                    <li>使用電腦版 Chrome 或 Edge 瀏覽器</li>
                                    <li>iOS 用戶可使用 AirPlay 螢幕鏡像功能</li>
                                    <li>或使用「全螢幕/投影模式」按鈕進行本機全螢幕顯示</li>
                                </ul>
                            </div>
                        </div>
            `,
            footer: `<button data-action="closeModal" class="w-full px-4 py-2 rounded-lg text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-colors font-bold">我知道了</button>`
        });
    },

    stopProjectorMode() {
        // 關閉 Presentation API 連接
        if (this.state.projector.presentationConnection) {
            try {
                this.state.projector.presentationConnection.terminate();
            } catch (e) {
                console.log('Failed to terminate presentation connection:', e);
            }
            this.state.projector.presentationConnection = null;
        }
        // 關閉 window.open 視窗
        if (this.state.projector.displayWindow && !this.state.projector.displayWindow.closed) {
            this.state.projector.displayWindow.close();
        }
        this.state.projector.displayWindow = null;
        // [記憶體優化] 關閉 BroadcastChannel 釋放資源
        if (this.state.projector.channel) {
            try {
                this.state.projector.channel.close();
            } catch (e) {
                console.log('Failed to close BroadcastChannel:', e);
            }
            this.state.projector.channel = null;
        }
        // 清除心跳計時器
        if (this.state.projector.heartbeatInterval) {
            clearInterval(this.state.projector.heartbeatInterval);
            this.state.projector.heartbeatInterval = null;
        }
        // 清除視窗檢查計時器
        if (this.state.projector.windowCheckInterval) {
            clearInterval(this.state.projector.windowCheckInterval);
            this.state.projector.windowCheckInterval = null;
        }
        this.state.projector.isActive = false;
        this.state.projector.mode = null;
        this.showNotification('投影模式已關閉', 'info');
    },

    toggleProjectorMode() {
        if (this.state.projector.isActive) {
            this.stopProjectorMode();
        } else {
            this.startProjectorMode();
        }
    },

    initSpeechRecognition() {
        this.state.speechRecognitionStatus = 'unavailable';
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn("Speech Recognition API is not supported in this browser.");
                this.recognition = null;
                return; // Gracefully exit if not supported
            }

            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'zh-TW';

            this.recognition.onstart = () => {
                this.state.isRecognizing = true;
                this.state.recognitionManuallyStopped = false;
                this.state.speechRecognitionStatus = 'active';
                console.log("Speech recognition started.");
                if (this.state.currentView === 'debate') this.renderTranscriptionPanel();
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // [第一層] 精確喚醒詞匹配 → 即時觸發
                if (this.state.timer.type === 'grace' && this.state.timer.graceInterval && !this.state.timer.isPaused && !this.state.mainSpeechTimerStartedByGrace) {
                    const combinedTranscript = finalTranscript + interimTranscript;
                    if (/(主席好|各位好|大家好|謝謝主席|謝謝|豬洗好|竹溪好|出息好|出席好|熟悉好|祖席好|楚溪好|出戲好|主媳好|主席號|儲蓄好|大加好|打家好|打架好|大家號|大甲好|達佳好|大叫好|大假好|各為好|各為號|哥餵好|割胃好|各位號|主席|對方便有|對方辯友|對方變有|對方變油|對方便由|退房辯友|堆放便有|對方沒有|兌放辯友|謝謝出席|寫寫主席|謝謝出息|歇歇主席|謝謝主廚)/.test(combinedTranscript)) {
                        console.log("Layer 1 - Wake word detected:", combinedTranscript);
                        if (this.state.graceOnresultTimeout) { clearTimeout(this.state.graceOnresultTimeout); this.state.graceOnresultTimeout = null; }
                        this.state.mainSpeechTimerStartedByGrace = true;
                        this.deactivateAudioDetection();
                        clearInterval(this.state.timer.graceInterval);
                        this.playSound('speechDetectedSound');
                        this.speak("開始計時", () => this.startMainSpeechTimer(this.state.currentFlow[this.state.currentStageIndex].duration));
                    }
                    // [第 1.5 層] 寬鬆文字匹配 → 辨識出任何 >2 字的文字即觸發
                    // 排除含「系統」的文字（系統暫停/系統開始及其 interim 片段），避免誤觸發
                    else if (combinedTranscript.trim().length > 2 && !combinedTranscript.includes('系統')) {
                        console.log("Layer 1.5 - Speech text detected (>3 chars), triggering:", combinedTranscript);
                        if (this.state.graceOnresultTimeout) { clearTimeout(this.state.graceOnresultTimeout); this.state.graceOnresultTimeout = null; }
                        this.state.mainSpeechTimerStartedByGrace = true;
                        this.deactivateAudioDetection();
                        clearInterval(this.state.timer.graceInterval);
                        this.playSound('speechDetectedSound');
                        this.speak("開始計時", () => this.startMainSpeechTimer(this.state.currentFlow[this.state.currentStageIndex].duration));
                    }
                    // [第二層] VAD 偵測 → 由 startAudioDetection 的 onSpeechStart/onSpeechEnd 處理
                    // 如果 VAD 偵測到連續 3 秒的發言，但前面兩層都沒觸發，會強制開始計時
                }
                // [自動換場] Handle End Word detection followed by silence during main timer
                if (this.state.isAutoMode && this.state.timer.type === 'main' && !this.state.timer.isPaused) {
                    const combinedTranscript = finalTranscript + interimTranscript;
                    if (/(謝謝大家|謝謝|結束|到此為止|發言完畢|我的申論到此結束|我的答辯到此結束|寫寫大家|謝謝大甲|謝謝打架|歇歇大家|卸卸大家|寫寫|歇歇|卸卸|些些|結樹|結數|解說|接收|劫數|傑叔|到此位置|到次為止|倒刺為止|道詞為止|到此為紙|發炎完畢|發現完畢|法院完畢|罰言完畢|發言玩斃|我的神論到此結束|我的深論到此結束|我的身論到此結束|我等申論到此結束|我的生存到此結束|我的大便到此結束|我的打扮到此結束|我的大辯到此結束|我得答辯到此結束)/.test(combinedTranscript)) {
                        if (!this.state.endWordTimeout && combinedTranscript.length > 0) {
                            console.log("End word detected, waiting for silence...");
                            this.state.endWordTimeout = setTimeout(() => {
                                console.log("Silence confirmed, auto advancing stage.");
                                this.state.endWordTimeout = null;
                                this.actions.nextStage();
                            }, 4000);
                        }
                    } else if (this.state.endWordTimeout && combinedTranscript.trim().length > 0) {
                        console.log("Speech continued, canceling auto-advance.");
                        clearTimeout(this.state.endWordTimeout);
                        this.state.endWordTimeout = null;
                    }
                }

                // [突發狀況防呆] Handle emergency stop/start words globally
                const combinedTranscriptForEmergency = finalTranscript + interimTranscript;

                // 1. 系統暫停（含常見誤辨識變體）
                if (/(系統暫停|系統暂停|系統讓停|系統暂休|系统暫停|解統暫停|繻統暫停|係統暫停)/.test(combinedTranscriptForEmergency)) {
                    const now = Date.now();
                    // 防止短時間內重複觸發（同一次辨識的 interim 與 final 可能连續觸發）
                    if (!this.state._lastEmergencyPauseTime || (now - this.state._lastEmergencyPauseTime) > 3000) {
                        if (!this.state.timer.isPaused && this.state.timer.type) {
                            console.log("Emergency stop word detected:", combinedTranscriptForEmergency);
                            this.state._lastEmergencyPauseTime = now;
                            this.actions.togglePause();
                            this.showNotification("語音指令：系統暫停", "warning");
                        }
                    }
                }

                // 2. 系統開始（含常見誤辨識變體）
                if (/(系統開始|系統开始|解統開始|繻統開始|係統開始|系統啟始)/.test(combinedTranscriptForEmergency)) {
                    const now = Date.now();
                    if (!this.state._lastEmergencyStartTime || (now - this.state._lastEmergencyStartTime) > 3000) {
                        // 情境 A: 在暫停中被喚醒 (Resume)
                        if (this.state.timer.isPaused && this.state.timer.type) {
                            console.log("Emergency start word detected! Resuming timer.");
                            this.state._lastEmergencyStartTime = now;
                            this.actions.togglePause();
                            this.showNotification("語音指令：系統開始", "success");
                        }
                    }
                }

                // Handle transcription panel results
                if (this.state.transcription.active) {
                    this.state.transcription.interimContent = interimTranscript;

                    if (finalTranscript) {
                        let currentParagraph = this.state.transcription.paragraphs.find(p => p.id === this.state.transcription.currentParagraphId);
                        if (!currentParagraph) {
                            const newParagraphId = 'p_' + Date.now();
                            const currentStage = this.state.currentFlow[this.state.currentStageIndex] || {};
                            const speaker = this.interpolateScript(currentStage.name) || '發言者';
                            const team = speaker.includes(this.state.positiveTeamName) ? 'positive' : (speaker.includes(this.state.negativeTeamName) ? 'negative' : 'neutral');

                            currentParagraph = { id: newParagraphId, speaker: speaker, team: team, content: '' };
                            this.state.transcription.paragraphs.push(currentParagraph);
                            this.state.transcription.currentParagraphId = newParagraphId;

                            // [記憶體優化] 限制最大段落數，移除最舊的段落
                            const maxParagraphs = this.state.transcription.MAX_PARAGRAPHS || 50;
                            while (this.state.transcription.paragraphs.length > maxParagraphs) {
                                this.state.transcription.paragraphs.shift();
                            }
                        }
                        currentParagraph.content += finalTranscript.trim() + '。 ';
                        this.state.transcription.interimContent = '';
                        this.state.transcription.currentParagraphId = null; // Ready for a new paragraph
                    }
                    this.renderTranscriptionParagraphs();
                }
            };

            this.recognition.onerror = (event) => {
                // 可恢復的錯誤：不做處理，讓 onend 自動重啟
                if (event.error === 'no-speech' || event.error === 'aborted' || event.error === 'network') {
                    console.warn(`語音辨識可恢復錯誤: ${event.error}`);
                    // onend 會自動觸發並處理重啟
                    return;
                }
                // 嚴重錯誤的處理
                console.error("Speech recognition error:", event.error);
                this.state.isRecognizing = false;
                this.state.speechRecognitionStatus = 'error';
                if (this.state.transcription.active) {
                    this.showNotification(`語音轉錄錯誤: ${event.error} `, 'error');
                    this.actions.stopTranscription();
                }
                if (this.state.currentView === 'debate') this.renderTranscriptionPanel();
                // [全局語音控制] 即使是嚴重錯誤，比賽中也嘗試重啟
                if (this.state.enableSpeechDetection && this.state.currentView === 'debate') {
                    console.log("Attempting to recover SpeechRecognition after error...");
                    setTimeout(() => this.startRecognition(), 500);
                }
            };
            this.recognition.onend = () => {
                this.state.isRecognizing = false;
                if (this.state.speechRecognitionStatus === 'active') {
                    this.state.speechRecognitionStatus = 'ready';
                }
                // [全局語音控制] 比賽進行中，語音辨識永遠自動重啟
                // 這確保「系統暫停」、「系統開始」等指令隨時可用
                let shouldRestart = false;
                if (this.state.enableSpeechDetection && this.state.currentView === 'debate' && !this.state.recognitionManuallyStopped) {
                    shouldRestart = true;
                }
                // 轉錄功能也需要持續辨識
                else if (this.state.transcription.active && !this.state.transcription.paused) {
                    shouldRestart = true;
                }

                if (shouldRestart) {
                    setTimeout(() => this.startRecognition(), 250);
                }
                if (this.state.currentView === 'debate') this.renderTranscriptionPanel();
            };

            this.state.speechRecognitionStatus = 'ready';
            console.log("Speech Recognition is ready.");

        } catch (e) {
            console.error("Failed to initialize Speech Recognition. This feature will be disabled.", e);
            this.recognition = null;
            this.state.speechRecognitionStatus = 'error';
        }
    },

    startRecognition() {
        if (this.recognition && !this.state.isRecognizing) {
            this.state.recognitionManuallyStopped = false;
            try {
                this.recognition.start();
            } catch (e) {
                // InvalidStateError = 已經在運行中，安全忽略
                if (e.name === 'InvalidStateError') {
                    console.log("SpeechRecognition already running, skipping start.");
                    return;
                }
                console.error("Recognition start error", e);
                this.state.speechRecognitionStatus = 'error';
                this.renderTranscriptionPanel();
            }
        }
    },

    stopRecognition() {
        // This function is for temporarily stopping, usually by pause or stage change
        if (this.recognition && this.state.isRecognizing) {
            this.state.recognitionManuallyStopped = true;
            // Don't set manually stopped if it's just for transcription pause
            if (this.state.transcription.paused) {
                this.state.recognitionManuallyStopped = false;
            }
            try { this.recognition.stop(); } catch (e) { console.error("Recognition stop error", e); }
        }
    },

    speak(text, onEndCallback) {
        // If speech is not supported or text is empty, execute callback immediately.
        if (!this.synth || !text) {
            if (onEndCallback) {
                try {
                    onEndCallback();
                } catch (e) {
                    console.error("Error in speak's onEndCallback (no synth):", e);
                }
            }
            return;
        }

        // If a new, important message comes in, clear the old queue and cancel any current speech.
        if (this.synth.speaking) {
            this.state.speechQueue = []; // Clear the queue of any pending utterances
            this.synth.cancel(); // Stop the current utterance
            this.state.isSpeaking = false;
        }

        this.state.speechQueue.push({ text, onEndCallback });

        // A short delay helps the synth engine reset after a cancel command
        setTimeout(() => this.processSpeechQueue(), 100);
    },

    processSpeechQueue() {
        if (this.state.isSpeaking || this.state.speechQueue.length === 0) {
            return;
        }

        // [BUG FIX START]
        // 檢查朗讀是否在任務排入佇列後，但在執行前被禁用了
        if (!this.state.enableSpeech) {
            console.log("Speech disabled, clearing queue and running callbacks.");
            // 立即執行並清空佇列中所有任務的回調，以確保流程繼續
            while (this.state.speechQueue.length > 0) {
                const { onEndCallback } = this.state.speechQueue.shift();
                if (onEndCallback) {
                    try { onEndCallback(); } catch (e) { console.error("Error in queue-clearing callback:", e); }
                }
            }
            this.state.isSpeaking = false; // 確保狀態被重置
            return; // 終止執行
        }
        // [BUG FIX END]

        this.state.isSpeaking = true;
        // [VAD 抑制] 系統朗讀時抑制 VAD，避免 TTS 音訊被偵測為辯手發言
        this.state.vadSuppressed = true;
        const { text, onEndCallback } = this.state.speechQueue.shift();

        if (!this.synth) {
            if (onEndCallback) onEndCallback();
            this.state.isSpeaking = false;
            this.processSpeechQueue(); // Try next item
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voice = this.voices.find(v => v.lang === 'zh-TW') || this.voices.find(v => v.lang.startsWith('zh')) || this.voices[0];
        if (voice) {
            utterance.voice = voice;
        }

        const onDone = (event) => {
            if (this.state.speechWatchdog) {
                clearInterval(this.state.speechWatchdog);
                this.state.speechWatchdog = null;
            }
            this.state.currentOnDoneCallback = null;
            // Make sure we are not already processing the next item
            if (this.state.isSpeaking) {
                this.state.isSpeaking = false;
                // [VAD 抑制] 延遲 500ms 解除抑制，讓 TTS 餘音消散後再重新偵測
                if (this.state.vadSuppressionTimeout) clearTimeout(this.state.vadSuppressionTimeout);
                this.state.vadSuppressionTimeout = setTimeout(() => {
                    this.state.vadSuppressed = false;
                    this.state.vadSuppressionTimeout = null;
                }, 500);
                if (onEndCallback) {
                    try {
                        onEndCallback();
                    } catch (e) {
                        console.error("Error in onEndCallback:", e, "for text:", text);
                    }
                }
                // Process next item in the queue with a small delay
                setTimeout(() => this.processSpeechQueue(), 50);
            }
        };

        utterance.onend = onDone;
        utterance.onerror = (e) => {
            if (e.error === 'interrupted' || e.error === 'canceled') {
                console.log(`Speech was interrupted for text: "${text}"`);
            } else {
                console.error("Speech synthesis utterance error:", e, "for text:", text);
            }
            onDone(e);
        };

        // [FIX] Chrome 有時候會瘋狂觸發 onresume，導致產生上百個計時器。
        // 我們改用單一的檢查機制：如果超過 15 秒沒有任何反應（並且不是暫停狀態），才強制跳過。
        if (this.state.speechWatchdog) clearInterval(this.state.speechWatchdog);
        let timeSpeaking = 0;
        this.state.speechWatchdog = setInterval(() => {
            // 如果被暫停，就不計算經過時間
            if (window.speechSynthesis && window.speechSynthesis.paused) {
                return;
            }
            timeSpeaking++;
            // 如果朗讀超過 30 秒（或引擎死機停在 true 狀態），強制終止以防死縮
            if (timeSpeaking >= 30) {
                console.warn("Speech synthesis watchdog triggered (max time exceeded). Forcing queue to advance for text:", text);
                onDone();
            }
        }, 1000);

        try {
            this.synth.speak(utterance);
        } catch (error) {
            console.error("Error in synth.speak() call:", error, "for text:", text);
            onDone(error);
        }
    },

    // ========== 多分頁語音偵測衕突防護 (Web Locks API) ==========
    // 使用 Web Locks API 確保同一時間只有一個分頁占用語音偵測資源

    async acquireSpeechLock() {
        // 如果環境不支援 Web Locks API，直接允許（不阻止功能執行）
        if (!navigator.locks) {
            console.warn('[TabLock] Web Locks API not supported, skipping lock.');
            return true;
        }

        // 已經持有鎖的話，直接返回 true
        if (this.state.speechDetectionLockController) {
            return true;
        }

        return new Promise((resolve) => {
            const controller = new AbortController();

            // 不使用 await，讓 request 在背景執行，並在 callback 執行時 resolve
            navigator.locks.request(
                'debate-timer-active-debate',
                { ifAvailable: true },
                (lock) => {
                    if (lock) {
                        // 成功取得鎖
                        this.state.speechDetectionLockController = controller;
                        console.log('[TabLock] Speech detection lock acquired.');
                        resolve(true); // 立即 resolve，讓主程式繼續執行

                        // 返回一個永不 resolve 的 Promise，以保持鎖不釋放
                        // 當 AbortController.abort() 被呼叫時，鎖會自動釋放
                        return new Promise((_, reject) => {
                            controller.signal.addEventListener('abort', () => {
                                console.log('[TabLock] Speech detection lock released.');
                                reject(new DOMException('Lock released', 'AbortError'));
                            });
                        });
                    } else {
                        // 其他分頁已持有鎖
                        console.log('[TabLock] Lock unavailable - another tab is using speech detection.');
                        resolve(false); // 取得鎖失敗
                        return Promise.resolve(); // 結束此 request
                    }
                }
            ).catch(e => {
                // AbortError 是釋放鎖時的正常情況
                if (e.name !== 'AbortError') {
                    console.error('[TabLock] Error acquiring lock:', e);
                }
                // 確保如果有其他錯誤也能 resolve(false)
                if (this.state.speechDetectionLockController !== controller) {
                    resolve(false);
                }
            });
        });
    },

    releaseSpeechLock() {
        if (this.state.speechDetectionLockController) {
            this.state.speechDetectionLockController.abort();
            this.state.speechDetectionLockController = null;
        }
    },

    // ========== VAD 持久化復用 ==========
    // 在比賽開始時只初始化一次 VAD（載入 Silero ONNX 模型），
    // 之後每個 grace period 只做「激活/停用」，不重建 VAD 實體。

    async initPersistentVAD() {
        if (typeof vad === "undefined") {
            this.showNotification("VAD 函式庫載入失敗，語音偵測無法使用。", "error");
            return;
        }
        // 如果已經初始化過，不重複建立
        if (this.state.audioDetection.vad) {
            console.log("Persistent VAD already initialized, skipping.");
            return;
        }

        try {
            // 取得麥克風流並保持開啟（整場比賽共用）
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000 } });

            if (!stream.getAudioTracks().length) {
                this.showNotification("麥克風沒有音訊軌道，無法初始化語音偵測。", "error");
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            const myvad = await vad.MicVAD.new({
                stream: stream,
                // 調整 Silero VAD 閾值，針對辯論場景優化
                positiveSpeechThreshold: 0.8,  // 預設 0.5 → 提高至 0.8 以過濾咳嗽/清喉嚨等非語音聲
                negativeSpeechThreshold: 0.35, // 預設 0.35 → 維持
                minSpeechFrames: 6,            // 預設 6 → 維持，需 6 幀連續語音（≈180ms）才觸發 onSpeechStart
                redemptionFrames: 8,           // 預設 8 → 維持，讓短暫氣音不會過早切斷
                onSpeechStart: () => {
                    // 只有在偵測被激活時才處理
                    if (!this.state.audioDetection.isActive) return;
                    // [VAD 抑制] 系統 TTS 朗讀中或剛結束，忽略此次偵測
                    if (this.state.vadSuppressed) {
                        console.log("Layer 2 (VAD) - Suppressed: system is speaking or just finished.");
                        return;
                    }

                    const { timer, mainSpeechTimerStartedByGrace } = this.state;
                    if (timer.type === 'grace' && timer.graceInterval && !mainSpeechTimerStartedByGrace && !timer.isPaused) {
                        // 如果有短暫停頓的緩衝計時器在跑，取消它（語音回來了）
                        if (this.state.vadPauseBufferTimeout) {
                            clearTimeout(this.state.vadPauseBufferTimeout);
                            this.state.vadPauseBufferTimeout = null;
                            console.log("Layer 2 (VAD) - Short pause tolerated, speech resumed.");
                        }

                        if (!this.state.vadSpeechStartTime) {
                            this.state.vadSpeechStartTime = Date.now();
                            console.log("Layer 2 (VAD) - Speech activity started.");
                        }
                        // 啟動 1.2 秒後強制觸發的 timeout（從 2 秒降低）
                        if (!this.state.vadFallbackTimeout) {
                            this.state.vadFallbackTimeout = setTimeout(() => {
                                const { timer: t, mainSpeechTimerStartedByGrace: started } = this.state;
                                if (!started && t.type === 'grace' && t.graceInterval && !t.isPaused) {
                                    console.log("Layer 2 (VAD) - 1.2s speech detected, forcing timer start.");
                                    this.state.mainSpeechTimerStartedByGrace = true;
                                    this.deactivateAudioDetection();
                                    clearInterval(this.state.timer.graceInterval);
                                    this.playSound('speechDetectedSound');
                                    this.speak("開始計時", () => this.startMainSpeechTimer(this.state.currentFlow[this.state.currentStageIndex].duration));
                                }
                                this.state.vadFallbackTimeout = null;
                            }, 3000);
                        }
                    }
                },
                onSpeechEnd: () => {
                    // 只有在偵測被激活時才處理
                    if (!this.state.audioDetection.isActive) return;

                    // [優化 2] 不立即重置，給 800ms 緩衝期
                    // 如果辯手只是換氣/短暫停頓，800ms 內 onSpeechStart 會再次觸發
                    if (this.state.vadFallbackTimeout && !this.state.vadPauseBufferTimeout) {
                        this.state.vadPauseBufferTimeout = setTimeout(() => {
                            // 800ms 過去了，仍然沒有新的語音 → 視為真正停止
                            if (this.state.vadFallbackTimeout) {
                                clearTimeout(this.state.vadFallbackTimeout);
                                this.state.vadFallbackTimeout = null;
                            }
                            this.state.vadSpeechStartTime = null;
                            this.state.vadPauseBufferTimeout = null;
                            console.log("Layer 2 (VAD) - Sustained silence (800ms), resetting.");
                        }, 1200);
                    }
                },
            });

            this.state.audioDetection = {
                vad: myvad,
                stream: stream,
                isActive: false, // 初始化後不立即激活，等 grace period 開始時才激活
            };

            myvad.start();
            console.log("Persistent VAD initialized and running (callbacks inactive until grace period).");

        } catch (err) {
            console.error("Failed to initialize persistent VAD:", err);
            this.showNotification("無法啟動語音偵測，請檢查麥克風權限。", "error");
        }
    },

    destroyPersistentVAD() {
        const { audioDetection } = this.state;

        if (audioDetection.vad && typeof audioDetection.vad.destroy === 'function') {
            try {
                audioDetection.vad.destroy();
            } catch (e) {
                console.error("Error while calling VAD destroy:", e);
            }
        }

        if (audioDetection.stream) {
            audioDetection.stream.getTracks().forEach(track => track.stop());
        }

        this.state.audioDetection = {
            vad: null,
            stream: null,
            isActive: false,
        };
        console.log("Persistent VAD destroyed and microphone released.");
    },

    async startAudioDetection(team) {
        if (!team) {
            console.warn("startAudioDetection called without a team. Aborting.");
            return;
        }
        if (!this.state.enableSpeechDetection) return;
        if (this.state.audioDetection.isActive) return;

        const mode = this.state.audioSourceModes[team];

        // 特殊情況：如果需要監聽「網頁音訊」而非麥克風，仍需重建 VAD
        if (mode === 'display') {
            if (!this.state.sharedDisplay.audioTrack || this.state.sharedDisplay.audioTrack.readyState === 'ended') {
                this.showNotification("網頁音訊來源已中斷或未設定，無法偵測。", "error", 5000);
                return;
            }
            // display 模式需要獨立的流，暫時銷毀再重建
            this.destroyPersistentVAD();
            try {
                const stream = new MediaStream([this.state.sharedDisplay.audioTrack.clone()]);
                const myvad = await vad.MicVAD.new({
                    stream: stream,
                    positiveSpeechThreshold: 0.8,
                    negativeSpeechThreshold: 0.35,
                    minSpeechFrames: 6,
                    redemptionFrames: 8,
                    onSpeechStart: () => {
                        if (!this.state.audioDetection.isActive) return;
                        // [VAD 抑制] 系統 TTS 朗讀中或剛結束，忽略此次偵測
                        if (this.state.vadSuppressed) {
                            console.log("Layer 2 (VAD/display) - Suppressed: system is speaking or just finished.");
                            return;
                        }
                        const { timer, mainSpeechTimerStartedByGrace } = this.state;
                        if (timer.type === 'grace' && timer.graceInterval && !mainSpeechTimerStartedByGrace && !timer.isPaused) {
                            if (this.state.vadPauseBufferTimeout) {
                                clearTimeout(this.state.vadPauseBufferTimeout);
                                this.state.vadPauseBufferTimeout = null;
                                console.log("Layer 2 (VAD/display) - Short pause tolerated, speech resumed.");
                            }
                            if (!this.state.vadSpeechStartTime) {
                                this.state.vadSpeechStartTime = Date.now();
                                console.log("Layer 2 (VAD/display) - Speech started.");
                            }
                            if (!this.state.vadFallbackTimeout) {
                                this.state.vadFallbackTimeout = setTimeout(() => {
                                    const { timer: t, mainSpeechTimerStartedByGrace: started } = this.state;
                                    if (!started && t.type === 'grace' && t.graceInterval && !t.isPaused) {
                                        console.log("Layer 2 (VAD/display) - 1.2s speech, forcing start.");
                                        this.state.mainSpeechTimerStartedByGrace = true;
                                        this.deactivateAudioDetection();
                                        clearInterval(this.state.timer.graceInterval);
                                        this.playSound('speechDetectedSound');
                                        this.speak("開始計時", () => this.startMainSpeechTimer(this.state.currentFlow[this.state.currentStageIndex].duration));
                                    }
                                    this.state.vadFallbackTimeout = null;
                                }, 3000);
                            }
                        }
                    },
                    onSpeechEnd: () => {
                        if (!this.state.audioDetection.isActive) return;
                        if (this.state.vadFallbackTimeout && !this.state.vadPauseBufferTimeout) {
                            this.state.vadPauseBufferTimeout = setTimeout(() => {
                                if (this.state.vadFallbackTimeout) {
                                    clearTimeout(this.state.vadFallbackTimeout);
                                    this.state.vadFallbackTimeout = null;
                                }
                                this.state.vadSpeechStartTime = null;
                                this.state.vadPauseBufferTimeout = null;
                                console.log("Layer 2 (VAD/display) - Sustained silence (800ms), resetting.");
                            }, 1200);
                        }
                    },
                });
                this.state.audioDetection = { vad: myvad, stream: stream, isActive: true };
                myvad.start();
                console.log("VAD started in display audio mode.");
            } catch (err) {
                console.error("Failed to start display VAD:", err);
            }
            return;
        }

        // 麥克風模式：直接激活已持久化的 VAD（無需重建）
        if (!this.state.audioDetection.vad) {
            console.warn("Persistent VAD not initialized, initializing now...");
            await this.initPersistentVAD();
        }

        this.state.audioDetection.isActive = true;
        console.log("Audio detection activated (persistent VAD, no reload).");
    },

    // 輕量停用：只關閉 isActive flag，不銷毀 VAD
    deactivateAudioDetection() {
        this.state.audioDetection.isActive = false;
        // 清除 VAD 相關的 timeout
        if (this.state.vadFallbackTimeout) {
            clearTimeout(this.state.vadFallbackTimeout);
            this.state.vadFallbackTimeout = null;
        }
        this.state.vadSpeechStartTime = null;
        console.debug("Audio detection deactivated (VAD still alive).");
    },

    // 相容性包裝：舊程式碼呼叫 stopAudioDetection() 時，只做輕量停用
    stopAudioDetection() {
        this.deactivateAudioDetection();
    },
    // audioCheckLoop 已被 VAD 的 onSpeechStart/onSpeechEnd 取代
    // VAD (Silero) 使用神經網路模型，比頻率閾值更精準

    playSound(soundId) {
        const sound = document.getElementById(soundId);
        // 檢查音效元素是否存在且有有效的來源
        if (sound && sound.src && sound.src !== window.location.href) {
            sound.currentTime = 0;
            sound.play().catch(() => { }); // 靜默失敗
        }
    },

    playRingSound(times = 1) {
        // 如果正在響鈴，則忽略新的請求，避免打斷
        if (App.state.isRinging) return;

        const sound = document.getElementById('ringSound');
        if (!sound) return;

        App.state.isRinging = true; // 設定旗標，表示開始響鈴
        let count = 0;

        const play = () => {
            if (count < times) {
                sound.currentTime = 0;
                sound.play().catch(() => { }); // 靜默失敗
                count++;

                if (count < times) {
                    // 如果還需要繼續響鈴，則設定下一次播放
                    setTimeout(play, 400);
                } else {
                    // 這是最後一次響鈴，在短暫延遲後重置旗標，允許下一次播放
                    setTimeout(() => {
                        App.state.isRinging = false;
                    }, 400);
                }
            }
        };

        play(); // 開始播放序列
    },
    finalizeRebuttalOrder(team) {
        // 防止重複觸發
        if (this.state.rebuttalOrder) return;

        this.state.rebuttalOrder = team;

        // 重新渲染畫面，這會讓按鈕變成 disabled 並顯示設定結果
        this.renderDebateFlowTracker();
        this.renderDebateStage();

        const chosenTeamName = team === 'positive' ? this.state.positiveTeamName : this.state.negativeTeamName;
        const resultText = `設定結果：由 ${chosenTeamName} 優先結辯`;

        // 語音播報結果，並在播報完畢後，於自動模式下準備進入下一階段
        this.speak(resultText, () => {
            if (this.state.isAutoMode) {
                this.state.autoAdvanceTimeout = setTimeout(() => this.actions.nextStage(), 2000);
            }
        });
    },

    getDebateFormat(formatName) {
        for (const groupName in this.debateFormatGroups) {
            if (this.debateFormatGroups[groupName][formatName]) {
                return this.debateFormatGroups[groupName][formatName];
            }
        }
        return null;
    },

    findFormatNameByFlow(flow) {
        const flowString = JSON.stringify(flow);
        for (const groupName in this.debateFormatGroups) {
            for (const formatName in this.debateFormatGroups[groupName]) {
                if (JSON.stringify(this.debateFormatGroups[groupName][formatName]) === flowString) {
                    return formatName;
                }
            }
        }
        return null;
    },

    /**
     * 檢查編輯器是否有未儲存的變更
     */
    hasUnsavedEditorChanges() {
        return JSON.stringify(this.state.currentFlow) !== JSON.stringify(this.state.originalFlowBeforeEdit);
    },

    /**
     * 更新編輯器未儲存指示器
     */
    updateEditorUnsavedIndicator() {
        const indicator = document.getElementById('editor-unsaved-indicator');
        const stageCountEl = document.getElementById('editor-stage-count');
        const totalDurationEl = document.getElementById('editor-total-duration');

        if (indicator) {
            if (this.hasUnsavedEditorChanges()) {
                indicator.classList.remove('hidden');
                indicator.classList.add('flex');
            } else {
                indicator.classList.add('hidden');
                indicator.classList.remove('flex');
            }
        }

        // 更新統計數據
        if (stageCountEl) {
            stageCountEl.textContent = this.state.currentFlow.length;
        }
        if (totalDurationEl) {
            const totalDuration = this.state.currentFlow.reduce((sum, s) => sum + (s.duration || 0), 0);
            if (totalDuration > 0) {
                const m = Math.floor(totalDuration / 60);
                const s = totalDuration % 60;
                totalDurationEl.textContent = m > 0 ? `${m} 分 ${s > 0 ? s + ' 秒' : ''} ` : `${s} 秒`;
            } else {
                totalDurationEl.textContent = '--';
            }
        }
    },

    /**
     * 執行切換編輯器流程
     */
    doSwitchEditorFlow(flowName) {
        if (flowName === "CUSTOM_EMPTY") {
            this.state.currentFlow = [];
            this.state.originalFlowBeforeEdit = [];
        } else {
            const format = this.getDebateFormat(flowName);
            this.state.currentFlow = JSON.parse(JSON.stringify(format || []));
            this.state.originalFlowBeforeEdit = JSON.parse(JSON.stringify(this.state.currentFlow));
        }
        this.renderEditorView();
        this.showNotification(`已載入「${flowName === 'CUSTOM_EMPTY' ? '空白流程' : flowName}」`, 'success');
    },

    /**
     * 解碼分享的流程字串 (無論是來自 URL 還是文字貼上)
     * @param {string} encodedData - 經過 btoa 和 pako 壓縮的字串
     * @returns {string | null} - 成功時返回新流程的名稱，失敗時返回 null
     */
    decodeFlow(encodedData) {
        try {
            const decodedBinary = atob(encodedData);
            const charData = decodedBinary.split('').map(c => c.charCodeAt(0));
            const compressedArray = new Uint8Array(charData);
            const decompressedString = pako.inflate(compressedArray, { to: 'string' });
            const sharedFlow = JSON.parse(decompressedString);

            if (Array.isArray(sharedFlow)) {
                const flowName = `匯入的流程(${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;

                // [重要] 將匯入的流程視為「自訂流程」
                if (!App.debateFormatGroups['自訂流程']) {
                    App.debateFormatGroups['自訂流程'] = {};
                }
                App.debateFormatGroups['自訂流程'][flowName] = sharedFlow;

                // [重要] 匯入後立刻存到 localStorage，使其永久保存
                localStorage.setItem('customDebateFlows', JSON.stringify(App.debateFormatGroups['自訂流程']));

                return flowName; // 返回新流程的名稱
            }
            return null;
        } catch (e) {
            console.error("Error parsing shared flow:", e);
            return null;
        }
    },

    checkForSharedFlow() {
        const params = new URLSearchParams(window.location.search);
        const flowData = params.get('flow');

        if (flowData) {
            const flowName = this.decodeFlow(flowData);

            if (flowName) {
                // 將新匯入的流程名稱設為待選中
                this.state.pendingSharedFlow = flowName;
                history.replaceState(null, '', window.location.pathname);
                App.showNotification(`已成功載入 "${flowName}"`, "success");
            } else {
                App.showNotification("載入分享的流程失敗，連結可能已損毀或版本不相容。", "error");
                history.replaceState(null, '', window.location.pathname);
            }
        }
    },

    showNotification(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        const a = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500' };
        const div = document.createElement('div');
        div.className = `px-4 py-2 text-white rounded-lg shadow-lg ${a[type] || a.info} `;
        div.textContent = message;
        container.appendChild(div);
        setTimeout(() => {
            div.style.transition = 'opacity 0.5s';
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 500);
        }, duration);
    },

    interpolateScript(script, options = {}) {
        if (!script) return "";
        let firstTeam = "", secondTeam = "";
        if (this.state.rebuttalOrder) {
            firstTeam = this.state.rebuttalOrder === 'positive' ? this.state.positiveTeamName : this.state.negativeTeamName;
            secondTeam = this.state.rebuttalOrder === 'positive' ? this.state.negativeTeamName : this.state.positiveTeamName;
        }

        const replacements = {
            positive_team_name: this.state.positiveTeamName,
            negative_team_name: this.state.negativeTeamName,
            debate_topic: this.state.debateTopic,
            first_rebuttal_team_name: firstTeam,
            second_rebuttal_team_name: secondTeam,
            selected_player: options.selected_player || '',
            selected_action_type: options.selected_action_type || '',
        };

        // 動態新增正反方選手變數 (支援 1-6 位辯士)
        const numNames = ['一', '二', '三', '四', '五', '六'];
        for (let i = 0; i < 6; i++) {
            replacements[`positive_player_${i + 1} `] = this.state.positiveTeamPlayers[i] || `正${numNames[i] || (i + 1)} `;
            replacements[`negative_player_${i + 1} `] = this.state.negativeTeamPlayers[i] || `反${numNames[i] || (i + 1)} `;
        }

        // 動態新增裁判變數 (支援 1-5 位裁判)
        for (let i = 0; i < 5; i++) {
            replacements[`judge_${i + 1} `] = this.state.judges[i] || `裁判${numNames[i] || (i + 1)} `;
        }

        return script.replace(/\{\{(\w+)\}\}/g, (match, key) => replacements[key] || match);
    },


    getTeamForStage(stage) {
        if (!stage) return null;
        if (stage.choosingTeam) return stage.choosingTeam; // 處理辯革盃等有 choosingTeam 的賽制

        const name = stage.name || '';

        // [FIX] 使用更嚴謹的正則表達式，確保只匹配開頭的隊伍名稱
        // (?:...) 是一個非捕獲組，^ 確保從字串開頭進行匹配
        const posRegex = new RegExp(`^(?:${this.state.positiveTeamName}|正方)`);
        const negRegex = new RegExp(`^(?:${this.state.negativeTeamName}|反方)`);

        // 順序很重要：先測試正方，再測試反方
        if (posRegex.test(name)) return 'positive';
        if (negRegex.test(name)) return 'negative';

        // 處理結辯抽籤後的特殊情況
        if (name.includes('先結辯方')) return this.state.rebuttalOrder;
        if (name.includes('後結辯方')) {
            return this.state.rebuttalOrder === 'positive' ? 'negative' : (this.state.rebuttalOrder === 'negative' ? 'positive' : null);
        }

        // 處理風雩盃對辯/自由辯 (預設由正方開始)
        if (stage.type === 'free_debate' && (name.includes('對辯') || name.includes('自由辯論'))) {
            return 'positive'; // 根據賽制，這些環節通常由正方先發言
        }

        return null; // 如果都找不到，則不進行偵測
    },

    // [效能優化] 快取格式化的時間字串
    _timeCache: new Map(),
    formatTime(seconds) {
        // Guard against negative values
        if (seconds < 0) seconds = 0;
        // 檢查快取
        if (this._timeCache.has(seconds)) {
            return this._timeCache.get(seconds);
        }
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        const result = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        // 只快取合理範圍內的值 (0-3600秒)
        if (seconds >= 0 && seconds <= 3600) {
            this._timeCache.set(seconds, result);
        }
        return result;
    },

    // 統一的計時器狀態判斷函數
    // 返回: 'normal' | 'warning' | 'danger'
    getTimerState(timeLeft, initialDuration) {
        // 危急狀態：剩餘 10 秒以下（總時間需大於 30 秒才觸發）
        if (initialDuration > 30 && timeLeft <= 10) return 'danger';
        // 警告狀態：剩餘 30 秒以下（總時間需大於 60 秒才觸發）
        if (initialDuration > 60 && timeLeft <= 30) return 'warning';
        // 正常狀態
        return 'normal';
    },

    async initializeDisplayAudio() {
        if (this.state.sharedDisplay.isInitialized) {
            return true; // 如果已經初始化過，直接返回成功
        }

        try {
            // 瀏覽器必須請求 video: true 才會跳出包含「分享分頁音訊」的選項
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: { sampleRate: 16000 }
            });

            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                this.showNotification("您分享的內容沒有音訊，無法偵測。請確認分享時已勾選「分享分頁音訊」。", "error", 6000);
                stream.getTracks().forEach(track => track.stop()); // 清理無用的串流
                return false;
            }

            // 儲存原始串流與音訊軌道
            this.state.sharedDisplay.stream = stream;
            this.state.sharedDisplay.audioTrack = audioTracks[0];
            this.state.sharedDisplay.isInitialized = true;

            // 監聽使用者是否從瀏覽器UI停止了分享
            this.state.sharedDisplay.audioTrack.onended = () => {
                console.log("Display audio track ended by user.");
                this.state.sharedDisplay.stream = null;
                this.state.sharedDisplay.audioTrack = null;
                this.state.sharedDisplay.isInitialized = false;

                if (this.state.currentView === 'debate') {
                    this.showNotification("畫面分享已停止，線上音訊偵測將會失效。", "warning", 5000);
                }
            };

            this.showNotification("已成功擷取網頁音訊。", "success");
            return true;

        } catch (err) {
            console.error("getDisplayMedia error:", err);
            if (err.name === "NotAllowedError" || err.name === "AbortError") {
                this.showNotification("您取消了畫面分享，將無法使用線上音訊偵測。", "warning", 5000);
            } else {
                this.showNotification("無法擷取畫面音訊，請檢查瀏覽器權限或設定。", "error", 5000);
            }
            return false;
        }
    },

    // [效能優化] 快取計時器 DOM 元素引用
    _cachedTimerEl: null,
    _cachedProgressEl: null,
    _lastTimerClass: null,

    updateTimerDisplay(time) {
        // 使用快取的 DOM 引用，避免每秒重新查詢
        if (!this._cachedTimerEl) {
            this._cachedTimerEl = document.getElementById('timerDisplay');
        }
        if (!this._cachedProgressEl) {
            this._cachedProgressEl = document.getElementById('timerProgressBar');
        }

        const timerEl = this._cachedTimerEl;
        const progressEl = this._cachedProgressEl;

        if (timerEl) {
            timerEl.textContent = this.formatTime(time);

            // [優化] 只在狀態變化時才更新類別
            let newClass = null;
            if (this.state.timer.initialDuration > 30 && time <= 10) newClass = 'text-red-500';
            else if (this.state.timer.initialDuration > 60 && time <= 30) newClass = 'text-yellow-500';

            if (newClass !== this._lastTimerClass) {
                timerEl.classList.remove('text-yellow-500', 'text-red-500');
                if (newClass) timerEl.classList.add(newClass);
                this._lastTimerClass = newClass;
            }
        }
        if (progressEl && this.state.timer.initialDuration > 0) {
            progressEl.style.width = `${(time / this.state.timer.initialDuration) * 100}% `;
        }
    },

    // --- TIMER LOGIC ---
    clearAllTimers() {
        // [FIX] 如果 TTS 處於暫停狀態（例如「系統暫停」後手動跳下一步），
        // 必須先 resume 再 cancel，否則 TTS 引擎會卡在暫停狀態，導致後續朗讀和自動跳轉失效
        if (window.speechSynthesis && window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
        this.deactivateAudioDetection();
        clearInterval(this.state.timer.interval);
        clearInterval(this.state.timer.graceInterval);
        if (this.state.endWordTimeout) clearTimeout(this.state.endWordTimeout);
        if (this.state.vadContinuousTimeout) clearInterval(this.state.vadContinuousTimeout);
        if (this.state.vadSilenceTimeout) clearTimeout(this.state.vadSilenceTimeout);
        if (this.state.graceOnresultTimeout) clearTimeout(this.state.graceOnresultTimeout);
        if (this.state.vadFallbackTimeout) clearTimeout(this.state.vadFallbackTimeout);
        this.state.endWordTimeout = null;
        this.state.vadContinuousTimeout = null;
        this.state.vadSilenceTimeout = null;
        this.state.vadFirstSpeechTime = null;
        this.state.vadFallbackTimeout = null;
        this.state.vadSpeechStartTime = null;
        this.state.graceOnresultTimeout = null;
        this.state.graceLastOnresultTime = null;
        this.state.graceMaxTranscriptLen = 0;

        this.state.timer.interval = null;
        this.state.timer.graceInterval = null;
        this.state.timer.isPaused = false;
        this.state.timer.type = null;

        // [效能優化] 清除 DOM 快取，以便下次重新獲取
        this._cachedTimerEl = null;
        this._cachedProgressEl = null;
        this._lastTimerClass = null;

        if (this.state.autoAdvanceTimeout) {
            clearTimeout(this.state.autoAdvanceTimeout);
            this.state.autoAdvanceTimeout = null;
        }

        if (this.state.sharedDisplay.audioTrack) {
            this.state.sharedDisplay.audioTrack.enabled = true;
        }
    },

    runTimerInterval() {
        // 1. 更新時間狀態
        App.state.timer.timeLeft--;

        // 2. [關鍵優化] 只更新數字顯示，不重新渲染整個控制列
        App.updateTimerDisplay(App.state.timer.timeLeft);

        // 如果有開啟 PiP，才更新畫布 (節省資源)
        if (App.state.pip.isActive) {
            App.renderPipCanvas();
        }

        // 如果有開啟投影模式，同步更新外部顯示
        if (App.state.projector.isActive) {
            App.sendProjectorUpdate();
        }

        const { timeLeft, type, initialDuration } = App.state.timer;

        // 3. 處理鈴聲邏輯 (只有主計時才響鈴，準備時間和整體準備時間不響)
        if (type === 'main') {
            if (timeLeft === 60 && initialDuration > 60) App.playRingSound(1);
            else if (timeLeft === 30 && initialDuration > 30) App.playRingSound(2);
        }

        // 4. 時間到處理
        if (timeLeft <= 0) {
            // 觸發視覺閃爍
            document.body.classList.add('visual-alarm');
            setTimeout(() => document.body.classList.remove('visual-alarm'), 3000);

            const timerEl = document.getElementById('timerDisplay');
            // 只有主計時到才響三聲鈴
            if (type === 'main') {
                App.playRingSound(3);
            }

            if (timerEl) {
                timerEl.textContent = "時間到";
                timerEl.classList.add('text-red-600', 'font-bold');
            }

            if (type === 'grace') {
                clearInterval(App.state.timer.graceInterval);
                // [FIX] Removed App.stopRecognition() to allow continuous listening
                const stage = App.state.currentFlow[App.state.currentStageIndex];
                if (!App.state.mainSpeechTimerStartedByGrace) {
                    App.speak("緩衝時間到，自動開始計時", () => App.startMainSpeechTimer(stage.duration));
                }
            } else {
                App.clearAllTimers();
                if (App.state.isAutoMode) {
                    App.state.autoAdvanceTimeout = setTimeout(() => App.actions.nextStage(), 2000);
                }
            }

            // [關鍵] 只有在狀態真正改變(時間到/暫停/開始)時，才需要重新渲染控制按鈕
            App.renderDebateControls();
        }
    },


    startGracePeriodTimer(stage, timerLabel) {
        this.clearAllTimers();
        this.state.timer.type = 'grace';
        const graceDuration = stage.graceDuration ?? this.state.customGraceDuration;
        this.state.timer.timeLeft = graceDuration;
        this.state.timer.initialDuration = graceDuration;
        this.state.mainSpeechTimerStartedByGrace = false;

        const finalLabel = timerLabel || this.interpolateScript(stage.timerLabel);
        const timerStatusEl = document.getElementById('timerStatus');
        if (timerStatusEl) {
            timerStatusEl.textContent = `準備(${finalLabel})`;
        }

        this.updateTimerDisplay(this.state.timer.timeLeft);

        // --- [NEW LOGIC START] ---
        if (graceDuration > 0 && this.state.enableSpeechDetection) {
            const team = this.getTeamForStage(stage);
            if (team) {
                const listeningMode = this.state.audioSourceModes[team];

                // 如果準備要監聽「麥克風」，則暫時「靜音」網頁音訊以防止聲音迴圈
                if (listeningMode === 'microphone' && this.state.sharedDisplay.audioTrack) {
                    console.log("Muting display audio to listen cleanly to the microphone.");
                    this.state.sharedDisplay.audioTrack.enabled = false;
                }
                // 反之，如果準備要監聽「網頁音訊」，則確保它是有啟用的
                else if (listeningMode === 'display' && this.state.sharedDisplay.audioTrack) {
                    this.state.sharedDisplay.audioTrack.enabled = true;
                }

                this.startAudioDetection(team);

                // [方案 A] 由於 deactivateAudioDetection() 不再殺掉麥克風軌道，
                // SpeechRecognition 的音訊管線不會中斷，無需強制重啟。

            } else {
                console.log("No specific team found for this stage, skipping audio detection.");
                // 如果沒有偵測到發言方，保險起見，確保網頁音訊是啟用的
                if (this.state.sharedDisplay.audioTrack) {
                    this.state.sharedDisplay.audioTrack.enabled = true;
                }
            }
        } else if (this.state.sharedDisplay.audioTrack) {
            // 如果語音偵測未啟用，也確保網頁音訊是啟用的
            this.state.sharedDisplay.audioTrack.enabled = true;
        }
        // --- [NEW LOGIC END] ---

        if (graceDuration <= 0) {
            this.runTimerInterval();
        } else {
            this.state.timer.graceInterval = setInterval(this.runTimerInterval.bind(this), 1000);
        }
        this.renderDebateControls();
    },

    startMainSpeechTimer(duration) {
        this.clearAllTimers();
        this.state.timer.type = 'main';
        this.state.timer.timeLeft = duration;
        this.state.timer.initialDuration = duration;

        const stage = this.state.currentFlow[this.state.currentStageIndex];
        const timerStatusEl = document.getElementById('timerStatus');
        if (timerStatusEl) {
            timerStatusEl.textContent = `${this.interpolateScript(stage.timerLabel || stage.baseTimerLabel)} 進行中...`;
        }
        this.updateTimerDisplay(duration);
        this.state.timer.interval = setInterval(this.runTimerInterval.bind(this), 1000);
        this.renderDebateControls();

        // [方案 A] 麥克風軌道不再被銷毀，SpeechRecognition 無需重啟。
    },

    startManualPrepTimer(duration) {
        this.clearAllTimers();
        this.state.timer.type = 'manual_prep';
        this.state.timer.timeLeft = duration;
        this.state.timer.initialDuration = duration;
        const stage = this.state.currentFlow[this.state.currentStageIndex];
        document.getElementById('timerStatus').textContent = `${this.interpolateScript(stage.timerLabel)} 進行中...`;
        this.updateTimerDisplay(duration);
        this.state.timer.interval = setInterval(this.runTimerInterval.bind(this), 1000);
        this.renderDebateControls();

        // [方案 A] 麥克風軌道不再被銷毀，SpeechRecognition 無需重啟。
    },

    loadStage(index) {
        const stage = this.state.currentFlow[index];
        if (!stage) return;

        // 時間戳功能：記錄階段切換時間
        if (this.state.recording.isRecording && this.state.recording.recordingStartTime) {
            // 計算經過時間，需扣除暫停期間累計的時間
            const totalElapsed = Date.now() - this.state.recording.recordingStartTime;
            const actualRecordingTime = totalElapsed - this.state.recording.pausedDuration;
            const elapsedSeconds = actualRecordingTime / 1000;
            this.state.recording.timestamps.push({
                time: elapsedSeconds,
                stageName: this.interpolateScript(stage.name || stage.timerLabel || `階段 ${index + 1}`),
                stageIndex: index
            });
        }

        // 記錄上一個視圖狀態，用於判斷是否需要重新渲染整個視圖
        const previousView = this.state.currentView;

        // [MODIFIED] 優先處理 free_debate 這種特殊介面的階段類型
        if (stage.type === 'free_debate') {
            // 1. 初始化或重設自由辯論的狀態
            const duration = stage.duration || 240; // 如果賽制沒寫時間，預設為4分鐘
            this.state.freeDebate = {
                stage: stage,
                initialDuration: duration,
                positiveTimeLeft: duration,
                negativeTimeLeft: duration,
                activeTeam: null,
                interval: null,
                isPaused: false,
                firstSpeakerSelected: false,
            };
            // 清除可能殘留的計時器
            clearInterval(this.state.freeDebate.interval);

            // 設置當前視圖為自由辯論
            this.state.currentView = 'free_debate';

            // 2. 透過 router 渲染自由辯論的專用介面
            this.router();

            // 3. 朗讀該階段的提示語
            this.speak(this.interpolateScript(stage.script));

            // 4. 處理完畢，中斷後續執行
            return;
        }

        // --- 以下為處理一般辯論階段的既有邏輯 ---

        // 設置視圖為一般辯論
        this.state.currentView = 'debate';

        // 如果前一個視圖是自由辯論，需要重新渲染整個視圖
        if (previousView === 'free_debate') {
            this.router();
        } else {
            // 渲染標準辯論介面（只更新部分內容）
            this.renderDebateFlowTracker();
            this.renderDebateStage();
        }

        if (this.state.pip.isActive) {
            this.renderPipCanvas();
        }

        // 異步執行階段的具體行為 (朗讀、計時等)
        const executeStage = async () => {
            let choiceResult = {};

            if (stage.type === 'choice_speech') {
                try {
                    choiceResult = await this.getStageChoice(stage);
                } catch (e) {
                    console.error("Choice was cancelled or failed", e);
                    if (this.state.isAutoMode) this.state.autoAdvanceTimeout = setTimeout(() => this.actions.nextStage(), 2000);
                    return; // 中斷執行
                }
            }

            // 裁判講評：先讓用戶選擇裁判
            if (stage.type === 'judge_comment') {
                try {
                    choiceResult = await this.getJudgeChoice(stage);
                } catch (e) {
                    console.error("Judge choice was cancelled or failed", e);
                    if (this.state.isAutoMode) this.state.autoAdvanceTimeout = setTimeout(() => this.actions.nextStage(), 2000);
                    return; // 中斷執行
                }
            }

            const speakCallback = () => {
                const timerLabel = this.interpolateScript(stage.timerLabel || stage.baseTimerLabel, choiceResult);
                switch (stage.type) {
                    case 'speech_auto':
                        this.startGracePeriodTimer(stage, timerLabel);
                        break;
                    case 'manual_prep':
                        if (this.state.isAutoMode) {
                            this.startManualPrepTimer(stage.duration);
                        } else {
                            this.renderDebateControls();
                        }
                        break;
                    case 'choice_speech':
                        this.startGracePeriodTimer(stage, timerLabel);
                        break;
                    case 'judge_comment':
                        // 裁判講評不計時，重新渲染階段顯示和控制列
                        this.renderDebateStage();
                        break;
                    case 'announcement':
                        if (this.state.isAutoMode) this.state.autoAdvanceTimeout = setTimeout(() => this.actions.nextStage(), 2000);
                        break;
                    case 'draw_rebuttal_order':
                        this.renderDebateControls();
                        // [全局語音控制] 語音辨識由 onend 自動管理，不需手動重啟
                        break;
                }
            };

            // 裁判講評：使用 choiceResult 中的講稿
            if (stage.type === 'judge_comment' && choiceResult && choiceResult.script) {
                this.speak(choiceResult.script, speakCallback);
            } else {
                const scriptToSpeak = this.interpolateScript(stage.script || stage.baseScript, choiceResult);
                this.speak(scriptToSpeak, speakCallback);
            }
        };

        executeStage();
    },

    getStageChoice(stage) {
        return new Promise((resolve, reject) => {
            this.state.currentChoice = { stage, resolve, reject };

            const team = stage.choosingTeam;

            // 處理固定的動作，例如 "立論"
            if (stage.fixedAction) {
                const selectedAction = stage.fixedAction;

                // 增加對應動作的計數
                // [FIX] 確保 key 存在於 counts 中，避免 Unicode 編碼差異問題
                const counts = (team === 'positive') ? this.state.positiveActionCounts : this.state.negativeActionCounts;
                if (typeof counts[selectedAction] !== 'number') {
                    counts[selectedAction] = 0;
                }
                counts[selectedAction]++;

                // 在當前階段物件中記錄已執行的動作，以便 "上一階段" 功能可以撤銷
                const currentStageInFlow = this.state.currentFlow[this.state.currentStageIndex];
                if (currentStageInFlow) {
                    currentStageInFlow.executedAction = selectedAction;
                }

                // 直接解析 Promise 並返回，不顯示選擇視窗
                resolve({ selected_player: '辯士', selected_action_type: selectedAction });
                this.state.currentChoice = { stage: null, resolve: null }; // 清空選擇狀態
                return;
            }

            // 處理需要彈出視窗讓使用者選擇的動作
            // 辯革盃規則：申論/質答各最多3次（對應九宮格的3輪）
            const actionCounts = (team === 'positive') ? this.state.positiveActionCounts : this.state.negativeActionCounts;
            const maxPerAction = 3; // 每種動作最多3次

            const optionsHTML = stage.actionChoices.map(action => {
                const used = actionCounts[action] || 0;
                const remaining = maxPerAction - used;
                const isDisabled = remaining <= 0;

                if (isDisabled) {
                    return `<button disabled class="px-8 py-4 rounded-xl text-white font-bold text-lg bg-gray-400 cursor-not-allowed opacity-50">${action} (已用完)</button>`;
                }
                return `<button data-action="confirmStageChoice" data-choice="${action}" class="px-8 py-4 rounded-xl text-white font-bold text-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition-all hover:scale-105 shadow-lg">${action} (剩${remaining}次)</button>`;
            }).join('');

            this.renderModal({
                title: `請 ${team === 'positive' ? this.state.positiveTeamName : this.state.negativeTeamName} 選擇此環節類型`,
                body: `<div class="flex justify-center flex-wrap gap-6 py-4">${optionsHTML}</div>`,
                footer: ''
            });
        });
    },

    // 裁判講評選擇對話框
    getJudgeChoice(stage) {
        return new Promise((resolve, reject) => {
            this.state.currentJudgeChoice = { stage, resolve, reject };

            const judges = this.state.judges || ['裁判一', '裁判二', '裁判三'];
            const totalJudges = judges.length;

            // 追蹤已講評的裁判
            if (!this.state.judgeCommentOrder) {
                this.state.judgeCommentOrder = [];
            }

            const commentedCount = this.state.judgeCommentOrder.length;
            const isFirstJudge = commentedCount === 0;
            const isLastJudge = commentedCount === totalJudges - 1;

            // 生成開場白（只在第一位裁判前顯示）
            let introText = '';
            if (isFirstJudge) {
                introText = `
            <div class="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 p-4 rounded-xl mb-4 text-center">
                <p class="text-slate-700 dark:text-slate-300 text-lg">
                    感謝雙方隊伍帶來一場精彩的比賽，<br>
                        接下來讓我們欣賞更精彩的裁判講評。
                </p>
                            </div>
            `;
            }

            const optionsHTML = judges.map((judge, index) => {
                const hasCommented = this.state.judgeCommentOrder.includes(index);
                const orderNum = this.state.judgeCommentOrder.indexOf(index) + 1;

                if (hasCommented) {
                    return `<button disabled class="px-6 py-4 rounded-xl text-white font-bold text-lg bg-gray-400 cursor-not-allowed opacity-50 min-w-[120px]">
            <div class="text-sm opacity-75">第${orderNum}位</div>
                                ${judge}
        <div class="text-xs mt-1">✓ 已講評</div>
                            </button>`;
                }
                return `<button data-action="confirmJudgeChoice" data-judge-index="${index}" class="px-6 py-4 rounded-xl text-white font-bold text-lg bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all hover:scale-105 shadow-lg min-w-[120px]">
            <div class="text-2xl mb-1">🎓</div>
                            ${judge}
                        </button>`;
            }).join('');

            // 顯示講評順序
            let orderInfo = '';
            if (this.state.judgeCommentOrder.length > 0) {
                const orderedNames = this.state.judgeCommentOrder.map(i => judges[i]).join(' → ');
                orderInfo = `<div class="text-sm text-slate-500 mb-4">已講評：${orderedNames}</div>`;
            }

            // 提示文字
            let hintText = '';
            if (isFirstJudge) {
                hintText = '請選擇第一位講評的裁判';
            } else if (isLastJudge) {
                hintText = '請選擇最後一位講評的裁判';
            } else {
                hintText = `請選擇第 ${commentedCount + 1} 位講評的裁判`;
            }

            // 重置按鈕
            const resetBtn = this.state.judgeCommentOrder.length > 0
                ? `<button data-action="resetJudgeCommentOrder" class="text-sm text-slate-500 hover:text-slate-700 underline">重置講評順序</button>`
                : '';

            this.renderModal({
                title: `🎓 ${hintText} `,
                body: `
                            ${introText}
                            ${orderInfo}
                            <div class="flex justify-center flex-wrap gap-4 py-4">${optionsHTML}</div>
                            <div class="text-center mt-4">${resetBtn}</div>
        `,
                footer: `<button data-action="closeModal" class="btn-secondary px-4 py-2 rounded-lg">取消</button>`
            });
        });
    },

    // 生成裁判講評的講稿
    getJudgeCommentScript(judgeIndex, judgeName) {
        const judges = this.state.judges || ['裁判一', '裁判二', '裁判三'];
        const totalJudges = judges.length;
        const commentedCount = this.state.judgeCommentOrder.length;

        // 根據順序生成不同的講稿
        if (commentedCount === 1) {
            // 第一位裁判
            return `首先，歡迎 ${judgeName} 前輩為我們講評。`;
        } else if (commentedCount === totalJudges) {
            // 最後一位裁判
            return `最後，歡迎 ${judgeName} 前輩為我們講評。`;
        } else {
            // 中間的裁判
            return `接著，歡迎 ${judgeName} 前輩為我們講評。`;
        }
    },

    // --- AUDIO RECORDING & DOWNLOAD ---
    async initAudioRecording() {
        if ('MediaRecorder' in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            this.state.recording.isAvailable = true;
            console.log("Audio recording is supported by the browser.");
        } else {
            this.state.recording.isAvailable = false;
            console.warn("MediaRecorder API not supported.");
        }
    },

    async startRecording() {
        if (!this.state.recording.isAvailable) {
            this.showNotification("錄音功能不可用或未授權。", "error");
            return;
        }
        if (this.state.recording.isRecording) return;

        try {
            this.state.recording.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioTrack = this.state.recording.mediaStream.getAudioTracks()[0];
            if (audioTrack) {
                this.state.recording.micAudioTrack = audioTrack;
                this.state.recording.isMicMuted = false; // 確保每次開始都是非靜音
                audioTrack.enabled = true; // 確保軌道是啟用的
            }
            this.state.recording.recordedChunks = [];
            this.state.recording.intermediateBlobs = []; // [記憶體優化] 清空中間 Blobs
            // 時間戳功能：初始化
            this.state.recording.timestamps = [];
            this.state.recording.recordingStartTime = Date.now();
            // 記錄當前階段作為第一個時間戳
            const currentStage = this.state.currentFlow[this.state.currentStageIndex];
            if (currentStage) {
                this.state.recording.timestamps.push({
                    time: 0,
                    stageName: this.interpolateScript(currentStage.name || currentStage.timerLabel || '開始'),
                    stageIndex: this.state.currentStageIndex
                });
            }

            const options = { mimeType: 'audio/webm; codecs=opus' };
            this.state.recording.mediaRecorder = new MediaRecorder(this.state.recording.mediaStream, options);

            this.state.recording.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.state.recording.recordedChunks.push(event.data);
                    // [記憶體優化] 每 50 個 chunks 合併一次
                    if (this.state.recording.recordedChunks.length >= 50) {
                        this._consolidateRecordingChunks();
                    }
                }
            };

            this.state.recording.mediaRecorder.onstop = () => {
                // [記憶體優化] 最終合併：先處理剩餘的 chunks，再合併所有 intermediateBlobs
                this._consolidateRecordingChunks();
                const { intermediateBlobs, timestamps, recordingStartTime } = this.state.recording;
                const audioBlob = new Blob(intermediateBlobs, { type: 'audio/webm' });

                // 儲存當前錄音到 recordings 陣列
                this.state.recording.recordings.push({
                    audioBlob: audioBlob,
                    timestamps: [...timestamps],
                    startTime: recordingStartTime,
                    endTime: Date.now()
                });

                // 更新當前 audioBlob（保持向下相容）
                this.state.recording.audioBlob = audioBlob;

                // 清空中間資料
                this.state.recording.intermediateBlobs = [];
                this.state.recording.recordedChunks = [];

                if (this.state.recording.mediaStream) {
                    this.state.recording.mediaStream.getTracks().forEach(track => track.stop());
                    this.state.recording.mediaStream = null;
                }
                this.state.recording.isRecording = false;
                this.renderTranscriptionPanel(); // 更新UI

                const recordingCount = this.state.recording.recordings.length;
                this.showNotification(`錄音段落 ${recordingCount} 已儲存。`, "info");

                // 如果是因為比賽結束而停止，則顯示下載畫面
                if (this.state.currentStageIndex >= this.state.currentFlow.length - 1) {
                    this.renderEndDebateDownloads();
                }
            };

            this.state.recording.mediaRecorder.start();
            this.state.recording.isRecording = true;

            // 自動啟動轉錄功能
            if (!this.state.transcription.active) {
                this.state.transcription.active = true;
                this.state.transcription.paused = false;
                this.startRecognition();
            }

            this.renderTranscriptionPanel(); // 更新UI
            this.renderDebateControls();
            if (this.state.currentFlow[this.state.currentStageIndex]?.type === 'free_debate') {
                this.renderFreeDebateControls(); // [新增] 如果在自由辯，也更新控制項
            }
            this.showNotification("錄音與轉錄已開始。", "success");

        } catch (err) {
            console.error("Error starting recording:", err);
            this.showNotification("無法開始錄音，請檢查麥克風權限。", "error");
        }
    },

    stopRecording() {
        if (this.state.recording.mediaRecorder && this.state.recording.isRecording) {
            // 如果正在暫停，先恢復再停止
            if (this.state.recording.isPaused) {
                this.state.recording.mediaRecorder.resume();
            }
            this.state.recording.mediaRecorder.stop();
            this.state.recording.micAudioTrack = null;
            this.state.recording.isMicMuted = false;
            this.state.recording.isPaused = false;

            // 同時停止轉錄
            if (this.state.transcription.active) {
                this.state.transcription.active = false;
                this.state.transcription.paused = false;
                // [全局語音控制] 不停止辨識，onend 會檢查 transcription.active 並決定是否重啟
            }
        }
    },

    pauseRecording() {
        const { recording } = this.state;
        if (!recording.mediaRecorder || !recording.isRecording || recording.isPaused) {
            return;
        }

        // 暫停 MediaRecorder
        recording.mediaRecorder.pause();
        recording.isPaused = true;
        recording.pauseStartTime = Date.now();

        // 同時暫停轉錄
        if (this.state.transcription.active && !this.state.transcription.paused) {
            this.state.transcription.paused = true;
            // [全局語音控制] 不停止辨識，onend 會檢查 transcription.paused 並決定是否重啟
        }

        this.renderTranscriptionPanel();
        this.showNotification("錄音已暫停", "info");
    },

    resumeRecording() {
        const { recording } = this.state;
        if (!recording.mediaRecorder || !recording.isRecording || !recording.isPaused) {
            return;
        }

        // 恢復 MediaRecorder
        recording.mediaRecorder.resume();

        // 累計暫停時間
        if (recording.pauseStartTime) {
            recording.pausedDuration += (Date.now() - recording.pauseStartTime);
            recording.pauseStartTime = null;
        }
        recording.isPaused = false;

        // 同時恢復轉錄
        if (this.state.transcription.active && this.state.transcription.paused) {
            this.state.transcription.paused = false;
            this.startRecognition();
        }

        this.renderTranscriptionPanel();
        this.showNotification("錄音已繼續", "success");
    },

    toggleMicMute() {
        const { recording } = this.state;
        if (!recording.micAudioTrack) {
            this.showNotification("麥克風不在啟用狀態 (請先開始錄音)", "warning");
            return;
        }

        // 切換靜音狀態
        recording.isMicMuted = !recording.isMicMuted;

        // 直接控制音訊軌道的啟用/禁用
        recording.micAudioTrack.enabled = !recording.isMicMuted;

        this.showNotification(`麥克風已 ${recording.isMicMuted ? '靜音' : '開啟'} `, "info");

        // 重新渲染UI，更新按鈕的樣式
        if (this.state.currentFlow[this.state.currentStageIndex]?.type === 'free_debate') {
            this.renderFreeDebateControls();
        } else {
            this.renderDebateControls();
        }
    },
    downloadAudio() {
        if (!this.state.recording.audioBlob) {
            this.showNotification("沒有可下載的錄音。", "error");
            return;
        }
        const url = URL.createObjectURL(this.state.recording.audioBlob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        const filename = `辯論錄音_${new Date().toISOString().slice(0, 10)}.webm`;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    },

    // 時間戳播放器
    renderRecordingPlayer() {
        // 移除已存在的播放器
        const existingPlayer = document.getElementById('recordingPlayerPanel');
        if (existingPlayer) existingPlayer.remove();

        if (!this.state.recording.audioBlob) return;

        const { timestamps } = this.state.recording;
        const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        // 產生時間戳列表
        let timestampListHTML = '';
        if (timestamps.length > 0) {
            timestampListHTML = timestamps.map((ts, i) => `
                        <button data-action="seekToTimestamp" data-timestamp-index="${i}" class="timestamp-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all hover:bg-[var(--color-primary)] hover:text-white group">
                            <span class="timestamp-time font-mono text-xs px-2 py-1 rounded bg-slate-200 dark:bg-slate-600 group-hover:bg-white/20">${formatTime(ts.time)}</span>
                            <span class="text-sm font-medium truncate">${ts.stageName}</span>
                        </button>
                    `).join('');
        } else {
            timestampListHTML = '<p class="text-sm text-slate-500 text-center py-4">沒有記錄到任何階段</p>';
        }

        // 建立播放器面板
        const playerPanel = document.createElement('div');
        playerPanel.id = 'recordingPlayerPanel';
        playerPanel.className = 'recording-player-panel fixed bottom-24 right-4 z-50 w-80 max-w-[calc(100%-2rem)] glass-panel rounded-2xl shadow-2xl overflow-hidden animate-scale-in';
        playerPanel.innerHTML = `
                    <!-- 標題列 -->
                    <div class="flex justify-between items-center px-4 py-3 border-b border-[var(--border-color)] bg-[var(--surface-2)]">
                        <div class="flex items-center gap-2">
                            <svg class="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.97l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                            <span class="font-bold text-sm">錄音播放器</span>
                        </div>
                        <button data-action="closeRecordingPlayer" class="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <!--音訊播放器 -->
                    <div class="px-4 py-3 bg-[var(--surface-1)]">
                        <audio id="recordingAudioPlayer" controls class="w-full h-10"></audio>
                    </div>

                    <!--階段列表 -->
                    <div class="px-3 py-2 max-h-64 overflow-y-auto space-y-1 bg-[var(--surface-1)]">
                        <p class="text-xs font-bold text-slate-500 uppercase px-1 mb-2">階段跳轉</p>
                        ${timestampListHTML}
                    </div>

                    <!--下載按鈕 -->
            <div class="p-3 border-t border-[var(--border-color)] bg-[var(--surface-2)]">
                <button data-action="downloadAudio" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    下載錄音檔案
                </button>
            </div>
        `;

        document.body.appendChild(playerPanel);

        // 設定音訊來源
        const audioPlayer = document.getElementById('recordingAudioPlayer');
        if (audioPlayer && this.state.recording.audioBlob) {
            audioPlayer.src = URL.createObjectURL(this.state.recording.audioBlob);
        }
    },

    seekToRecordingTimestamp(index) {
        const { timestamps } = this.state.recording;
        const audioPlayer = document.getElementById('recordingAudioPlayer');

        if (!audioPlayer || !timestamps[index]) return;

        // timestamps.time 已經是秒為單位
        audioPlayer.currentTime = timestamps[index].time;
        audioPlayer.play().catch(err => console.log("Audio play prevented:", err));

        // 高亮當前選中的時間戳
        const allBtns = document.querySelectorAll('[data-timestamp-index]');
        allBtns.forEach(btn => btn.classList.remove('active', 'bg-[var(--color-primary)]', 'text-white'));
        const activeBtn = document.querySelector(`[data-timestamp-index="${index}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-[var(--color-primary)]', 'text-white');
        }
    },

    seekToEndScreenTimestamp(index) {
        const { timestamps } = this.state.recording;
        const audioPlayer = document.getElementById('endScreenAudioPlayer');

        if (!audioPlayer || !timestamps[index]) return;

        // timestamps.time 已經是秒為單位
        audioPlayer.currentTime = timestamps[index].time;
        audioPlayer.play().catch(err => console.log("Audio play prevented:", err));

        // 高亮當前選中的時間戳
        const allBtns = document.querySelectorAll('[data-timestamp-index]');
        allBtns.forEach(btn => btn.classList.remove('active', 'bg-[var(--color-primary)]', 'text-white'));
        const activeBtn = document.querySelector(`[data-timestamp-index="${index}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active', 'bg-[var(--color-primary)]', 'text-white');
        }
    },

    // 多段錄音：跳轉到特定錄音段落的特定時間戳
    seekToMultiRecording(recIndex, tsIndex) {
        const { recordings } = this.state.recording;
        if (!recordings[recIndex]) return;

        const rec = recordings[recIndex];
        const audioPlayer = document.getElementById(`endScreenAudioPlayer_${recIndex}`);

        if (!audioPlayer || !rec.timestamps[tsIndex]) return;

        // timestamps.time 已經是秒為單位
        audioPlayer.currentTime = rec.timestamps[tsIndex].time;
        audioPlayer.play().catch(err => console.log("Audio play prevented:", err));
    },

    // 下載單個錄音段落
    downloadSingleRecording(recIndex) {
        const { recordings } = this.state.recording;
        if (!recordings[recIndex]) return;

        const rec = recordings[recIndex];
        const url = URL.createObjectURL(rec.audioBlob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        const filename = `辯論錄音_段落${recIndex + 1}_${new Date().toISOString().slice(0, 10)}.webm`;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        this.showNotification(`已下載錄音段落 ${recIndex + 1} `, "success");
    },

    // 下載全部錄音（合併為一個檔案或分開下載）
    async downloadAllRecordings() {
        const { recordings } = this.state.recording;
        if (recordings.length === 0) return;

        // 嘗試合併所有錄音
        try {
            const allBlobs = recordings.map(r => r.audioBlob);
            const mergedBlob = new Blob(allBlobs, { type: 'audio/webm' });

            const url = URL.createObjectURL(mergedBlob);
            const a = document.createElement('a');
            document.body.appendChild(a);
            a.style = 'display: none';
            a.href = url;
            const filename = `辯論錄音_完整_${new Date().toISOString().slice(0, 10)}.webm`;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            this.showNotification(`已下載全部 ${recordings.length} 段錄音`, "success");
        } catch (err) {
            console.error("Error merging recordings:", err);
            this.showNotification("合併失敗，請分別下載各段落", "error");
        }
    },

    // 使用 Web Share API 分享錄音
    async shareSingleRecording(recIndex) {
        const { recordings } = this.state.recording;
        if (!recordings[recIndex]) return;

        const rec = recordings[recIndex];
        const filename = `辯論錄音_段落${recIndex + 1}_${new Date().toISOString().slice(0, 10)}.webm`;

        // 格式化時間為 mm:ss
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        // 生成時間標記文字清單
        let timestampText = '';
        if (rec.timestamps && rec.timestamps.length > 0) {
            timestampText = '\n\n📍 時間標記（可用於跳轉）：\n';
            timestampText += rec.timestamps.map((ts, idx) =>
                `${formatTime(ts.time)} - ${ts.stageName}`
            ).join('\n');
        }

        // 組合分享文字
        const shareText = `🎙️ 辯論錄音 - 段落 ${recIndex + 1}\n` +
            `📝 辯題：${this.state.debateTopic}\n` +
            `🟢 正方：${this.state.positiveTeamName}\n` +
            `🔴 反方：${this.state.negativeTeamName}` +
            timestampText;

        // 檢查瀏覽器是否支援 Web Share API
        if (!navigator.share) {
            // 不支援分享，複製到剪貼簿
            try {
                await navigator.clipboard.writeText(shareText);
                this.showNotification("時間標記已複製到剪貼簿，請先下載錄音後一併分享", "success");
            } catch (e) {
                this.showNotification("您的瀏覽器不支援分享功能，請使用下載按鈕", "warning");
            }
            return;
        }

        // 檢查是否支援檔案分享
        const file = new File([rec.audioBlob], filename, { type: 'audio/webm' });

        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
            // 如果不支援檔案分享，嘗試只分享文字（含時間標記）
            try {
                await navigator.share({
                    title: `辯論錄音 - ${this.state.debateTopic}`,
                    text: shareText
                });
                this.showNotification("已分享資訊（請先下載錄音後附加）", "info");
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error("Share failed:", err);
                    this.showNotification("分享失敗", "error");
                }
            }
            return;
        }

        // 支援檔案分享 - 同時分享檔案和時間標記
        try {
            await navigator.share({
                files: [file],
                title: `辯論錄音 - ${this.state.debateTopic}`,
                text: shareText
            });
            this.showNotification("已分享錄音與時間標記", "success");
        } catch (err) {
            if (err.name === 'AbortError') {
                // 使用者取消分享，不顯示錯誤
                return;
            }
            console.error("Share failed:", err);
            this.showNotification("分享失敗，請嘗試下載後手動分享", "error");
        }
    },

    // 複製時間標記到剪貼簿
    async copyTimestamps(recIndex) {
        const { recordings } = this.state.recording;
        if (!recordings[recIndex]) return;

        const rec = recordings[recIndex];
        if (!rec.timestamps || rec.timestamps.length === 0) {
            this.showNotification("此錄音段落沒有時間標記", "info");
            return;
        }

        // 格式化時間為 mm:ss
        const formatTime = (seconds) => {
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        };

        // 生成時間標記文字
        const timestampText = `📍 辯論錄音時間標記（段落 ${recIndex + 1}）\n` +
            `📝 辯題：${this.state.debateTopic}\n\n` +
            rec.timestamps.map((ts) =>
                `${formatTime(ts.time)} - ${ts.stageName}`
            ).join('\n');

        try {
            await navigator.clipboard.writeText(timestampText);
            this.showNotification("時間標記已複製到剪貼簿", "success");
        } catch (e) {
            console.error("Copy failed:", e);
            this.showNotification("複製失敗", "error");
        }
    },

    downloadTranscript() {
        const { paragraphs } = this.state.transcription;
        if (paragraphs.length === 0) {
            this.showNotification("沒有可下載的逐字稿。", "error");
            return;
        }

        // 1. 將所有段落按照 speaker (即階段名稱) 進行分組
        const groupedByStage = paragraphs.reduce((acc, p) => {
            const stageName = p.speaker || "未分類";
            if (!acc[stageName]) {
                acc[stageName] = "";
            }
            // 將同一階段的內容串接起來
            acc[stageName] += p.content;
            return acc;
        }, {});

        // 2. 產生檔案標頭
        let transcriptContent = `辯題：${this.state.debateTopic} \n`;
        transcriptContent += `正方：${this.state.positiveTeamName} \n`;
        transcriptContent += `反方：${this.state.negativeTeamName} \n\n`;
        transcriptContent += "--- 逐字稿 ---\n\n";

        // 3. 遍歷分組後的物件，產生最終格式的文字
        for (const stageName in groupedByStage) {
            transcriptContent += `[${stageName}]\n`;
            transcriptContent += `${groupedByStage[stageName].trim()} \n\n`;
        }

        // 4. 建立 Blob 並觸發下載
        const blob = new Blob([transcriptContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.style = 'display: none';
        a.href = url;
        const filename = `辯論逐字稿_${new Date().toISOString().slice(0, 10)}.txt`;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    },
    renderEndDebateDownloads() {
        // 設定視圖為結束畫面
        this.state.currentView = 'end';

        const { recordings } = this.state.recording;
        const hasRecordings = recordings.length > 0;
        const hasTranscript = this.state.transcription.paragraphs.length > 0;

        // 時間格式化
        const formatTime = (seconds) => {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        // 產生錄音段落選擇器和播放器
        let recordingsHTML = '';
        if (hasRecordings) {
            recordingsHTML = recordings.map((rec, recIndex) => {
                const duration = (rec.endTime - rec.startTime) / 1000;
                const timestampsHTML = rec.timestamps.map((ts, tsIndex) => `
                            <button data-action="seekToMultiRecording" data-rec-index="${recIndex}" data-timestamp-index="${tsIndex}" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all bg-white/50 dark:bg-slate-700/50 hover:bg-[var(--color-primary)] hover:text-white group text-xs">
                                <span class="font-mono px-2 py-1 rounded bg-slate-200 dark:bg-slate-600 group-hover:bg-white/20 min-w-[50px] text-center">${formatTime(ts.time)}</span>
                                <span class="flex-1 truncate">${ts.stageName}</span>
                            </button>
                        `).join('');

                return `
                            <div class="recording-segment bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border-color)]">
                                <div class="flex items-center justify-between mb-3">
                                    <p class="text-sm font-bold flex items-center gap-2">
                                        <span class="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center">${recIndex + 1}</span>
                                        錄音段落 ${recIndex + 1}
                                    </p>
                                    <span class="text-xs text-slate-500">${formatTime(duration)}</span>
                                </div>
                                <audio id="endScreenAudioPlayer_${recIndex}" controls class="w-full h-10 mb-3"></audio>
                                ${rec.timestamps.length > 0 ? `
                                    <div class="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        ${timestampsHTML}
                                    </div>
                                ` : ''}
                                <div class="mt-3 pt-3 border-t border-[var(--border-color)] flex gap-2 flex-wrap">
                                    <button data-action="downloadSingleRecording" data-rec-index="${recIndex}" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-[var(--color-primary)] hover:text-white transition-colors">
                                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                        </svg>
                                        下載
                                    </button>
                                    <button data-action="shareSingleRecording" data-rec-index="${recIndex}" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90 transition-opacity">
                                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                                        </svg>
                                        分享
                                    </button>
                                    ${rec.timestamps.length > 0 ? `
                                    <button data-action="copyTimestamps" data-rec-index="${recIndex}" class="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 hover:bg-amber-500 hover:text-white transition-colors" title="複製時間標記">
                                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z" />
                                        </svg>
                                        複製標記
                                    </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
            }).join('');
        }

        // 渲染整個 mainContent 區域
        this.mainContent.innerHTML = `
                <div class="min-h-[80vh] flex items-center justify-center p-4 animate-fade-in-up">
                <div class="glass-panel p-8 rounded-3xl shadow-2xl space-y-6 max-w-3xl w-full">
                    <!-- 標題 -->
                    <div class="text-center">
                        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white text-4xl mb-4 shadow-xl animate-bounce-subtle">
                            🎉
                        </div>
                        <h2 class="font-black text-3xl mb-2 bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">比賽結束</h2>
                        <p class="text-slate-600 dark:text-slate-300 text-lg">恭喜完成比賽！您可以下載或回放本次比賽的紀錄</p>
                    </div>

                    <!-- 比賽資訊摘要 -->
                    <div class="bg-[var(--surface-2)] rounded-xl p-4 border border-[var(--border-color)] text-center">
                        <p class="text-sm text-slate-500 mb-1">辯題</p>
                        <p class="font-bold text-lg">${this.state.debateTopic}</p>
                        <div class="flex justify-center gap-4 mt-3 text-sm">
                            <span class="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">${this.state.positiveTeamName}</span>
                            <span class="text-slate-400">vs</span>
                            <span class="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium">${this.state.negativeTeamName}</span>
                        </div>
                    </div>

                    <!-- 錄音段落列表 -->
                    ${hasRecordings ? `
                            <div class="border-t border-[var(--border-color)] pt-6">
                                <p class="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2 justify-center">
                                    <svg class="w-5 h-5 text-[var(--color-primary)]" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z"/>
                                    </svg>
                                    錄音回放 (${recordings.length} 段)
                                </p>
                                <div class="space-y-4 max-h-80 overflow-y-auto pr-2">
                                    ${recordingsHTML}
                                </div>
                            </div>
                        ` : `
                            <div class="text-center py-8 text-slate-500">
                                <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                                <p>本場比賽沒有錄音紀錄</p>
                            </div>
                        `}

                    <!-- 逐字稿顯示區域 -->
                    ${hasTranscript ? `
                            <div class="border-t border-[var(--border-color)] pt-6">
                                <p class="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2 justify-center">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                    </svg>
                                    逐字稿內容
                                </p>
                                <div class="bg-[var(--surface-2)] rounded-xl border border-[var(--border-color)] max-h-64 overflow-y-auto">
                                    <div class="p-4 space-y-4">
                                        ${this.state.transcription.paragraphs.map(p => {
            const isPos = p.team === 'positive';
            const isNeg = p.team === 'negative';
            const avatarColor = isPos ? 'bg-green-500' : (isNeg ? 'bg-red-500' : 'bg-slate-500');
            return `
                                                <div class="flex gap-3">
                                                    <div class="flex-shrink-0 w-8 h-8 rounded-full ${avatarColor} text-white flex items-center justify-center text-xs font-bold shadow-md">
                                                        ${p.speaker.charAt(0)}
                                                    </div>
                                                    <div class="flex-grow">
                                                        <div class="text-xs font-bold text-slate-500 mb-1">${p.speaker}</div>
                                                        <div class="text-sm leading-relaxed bg-white dark:bg-slate-700/50 rounded-lg px-3 py-2 shadow-sm">${p.content}</div>
                                                    </div>
                                                </div>
                                            `;
        }).join('')}
                                    </div>
                                </div>
                            </div>
                        ` : ''}

                    <!-- 下載全部按鈕 -->
                    <div class="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-[var(--border-color)]">
                        ${hasRecordings && recordings.length > 1 ? `
                                <button data-action="downloadAllRecordings" class="flex items-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-semibold rounded-xl text-base px-6 py-3 transition-all duration-200 shadow-lg hover:shadow-xl">
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>
                                    下載全部錄音
                                </button>
                            ` : ''}
                        <button data-action="downloadTranscript" class="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-xl text-base px-6 py-3 transition-all duration-200 shadow-lg hover:shadow-xl ${!hasTranscript ? 'opacity-50 cursor-not-allowed' : ''}" ${!hasTranscript ? 'disabled' : ''}>
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            下載逐字稿 (.txt)
                        </button>
                    </div>

                    <!-- 返回按鈕 -->
                    <div class="text-center pt-4">
                        <button data-action="confirmReset" class="inline-flex items-center gap-2 text-base text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-400 font-semibold py-2 px-4 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                            </svg>
                            返回主畫面
                        </button>
                    </div>
                </div>
                </div>
            `;

        // 設定所有錄音播放器的音訊來源
        recordings.forEach((rec, i) => {
            const audioPlayer = document.getElementById(`endScreenAudioPlayer_${i}`);
            if (audioPlayer && rec.audioBlob) {
                audioPlayer.src = URL.createObjectURL(rec.audioBlob);
            }
        });
    },

    // --- PICTURE-IN-PICTURE ---
    renderPipCanvas() {
        if (!this.pipCtx) return;

        const ctx = this.pipCtx;
        const canvas = this.pipCanvas;
        const isDark = document.documentElement.classList.contains('dark');
        const stage = this.state.currentFlow[this.state.currentStageIndex];

        // --- Styles ---
        const bgColor = isDark ? '#0f172a' : '#f1f5f9';
        const textColor = isDark ? '#e2e8f0' : '#1e293b';
        const secondaryTextColor = isDark ? '#94a3b8' : '#475569';
        const posColor = '#2563eb'; // blue-600 for positive team
        const negColor = '#dc2626'; // red-600 for negative team
        const bodyFont = (size) => `400 ${size}px Inter, sans-serif`;
        const monoFont = (size) => `600 ${size}px "JetBrains Mono", monospace`;

        // --- Clear Canvas ---
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // --- 判斷是否為自由辯論模式 ---
        if (stage && stage.type === 'free_debate') {
            const { freeDebate, positiveTeamName, negativeTeamName } = this.state;
            const { positiveTimeLeft, negativeTimeLeft, initialDuration, activeTeam, isPaused } = freeDebate;

            const halfWidth = canvas.width / 2;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // --- 繪製正方計時器 (左側) ---
            ctx.fillStyle = (activeTeam === 'positive' && !isPaused) ? posColor : secondaryTextColor;
            ctx.font = bodyFont(28);
            ctx.fillText(positiveTeamName, halfWidth / 2, 80);

            ctx.fillStyle = (activeTeam === 'positive' && !isPaused) ? posColor : textColor;
            ctx.font = monoFont(80);
            ctx.fillText(this.formatTime(positiveTimeLeft), halfWidth / 2, canvas.height / 2 + 10);

            // 正方進度條
            const posProgress = Math.max(0, positiveTimeLeft / initialDuration);
            ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
            ctx.fillRect(40, canvas.height - 60, halfWidth - 80, 20);
            ctx.fillStyle = posColor;
            ctx.fillRect(40, canvas.height - 60, (halfWidth - 80) * posProgress, 20);

            // --- 繪製反方計時器 (右側) ---
            ctx.fillStyle = (activeTeam === 'negative' && !isPaused) ? negColor : secondaryTextColor;
            ctx.font = bodyFont(28);
            ctx.fillText(negativeTeamName, halfWidth + halfWidth / 2, 80);

            ctx.fillStyle = (activeTeam === 'negative' && !isPaused) ? negColor : textColor;
            ctx.font = monoFont(80);
            ctx.fillText(this.formatTime(negativeTimeLeft), halfWidth + halfWidth / 2, canvas.height / 2 + 10);

            // 反方進度條
            const negProgress = Math.max(0, negativeTimeLeft / initialDuration);
            ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
            ctx.fillRect(halfWidth + 40, canvas.height - 60, halfWidth - 80, 20);
            ctx.fillStyle = negColor;
            ctx.fillRect(halfWidth + 40, canvas.height - 60, (halfWidth - 80) * negProgress, 20);
        } else {
            // --- 原有的標準計時器繪製邏輯 ---
            const accentColor = '#4f46e5';
            const yellowColor = '#f59e0b';
            const redColor = '#ef4444';

            let timerLabel = "辯時計 Pro";
            let timeLeft = this.state.timer.timeLeft;
            let initialDuration = this.state.timer.initialDuration;
            let displayTime;

            if (stage && (this.state.currentView === 'debate' || this.state.currentView === 'free_debate')) {
                const timerStatusEl = document.getElementById('timerStatus');
                timerLabel = timerStatusEl ? timerStatusEl.textContent : this.interpolateScript(stage.timerLabel || stage.name);

                if (this.state.timer.type) {
                    displayTime = this.formatTime(timeLeft);
                } else if (stage.duration) {
                    displayTime = this.formatTime(stage.duration);
                    timeLeft = stage.duration;
                    initialDuration = stage.duration;
                } else {
                    displayTime = "--:--";
                    timeLeft = 0;
                    initialDuration = 0;
                }
            } else {
                timerLabel = "賽前準備";
                displayTime = this.formatTime(0);
                timeLeft = 0;
                initialDuration = 0;
            }

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.font = bodyFont(28);
            ctx.fillStyle = secondaryTextColor;
            ctx.fillText(timerLabel, canvas.width / 2, 80, canvas.width - 40);

            ctx.font = monoFont(128);
            // 使用統一的計時器狀態判斷
            const timerState = this.getTimerState(timeLeft, initialDuration);
            if (timerState === 'danger') ctx.fillStyle = redColor;
            else if (timerState === 'warning') ctx.fillStyle = yellowColor;
            else ctx.fillStyle = textColor;
            ctx.fillText(displayTime, canvas.width / 2, canvas.height / 2 + 10);

            if (initialDuration > 0) {
                const barHeight = 20;
                const barY = canvas.height - barHeight - 30;
                const barWidth = canvas.width - 80;
                const barX = 40;
                const progress = Math.max(0, timeLeft / initialDuration);

                ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
                ctx.fillRect(barX, barY, barWidth, barHeight);

                ctx.fillStyle = accentColor;
                ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            }
        }
    },


};

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('Service Worker registered:', reg))
            .catch((err) => console.log('Service Worker registration failed:', err));
    });
}

document.addEventListener('DOMContentLoaded', () => App.init());
const blockedIpPrefixes = ["163.14."];

async function checkIpAndBlock() {
    try {
        // 1.  IP
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) return; // 如果查詢失敗，則不執行任何動作

        const data = await response.json();
        const userIp = data.ip;

        const isBlocked = blockedIpPrefixes.some(prefix => userIp.startsWith(prefix));

        if (isBlocked) {
            // 3. 如果是，就隱藏網頁內容並顯示禁止存取的訊息
            console.warn(`Access denied for IP: ${userIp} `);
            document.body.innerHTML = `
            <div style="text-align: center; padding: 50px; font-family: sans-serif;">
                        <h1>Access Denied</h1>
                        <p>您所在的網路位置已被限制存取此服務。</p>
                    </div>
                `;
        }
    } catch (error) {
        console.error("IP check failed:", error);
    }
}

// 執行檢查
checkIpAndBlock();
