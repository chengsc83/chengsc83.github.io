require('whatwg-fetch');
const App = require('../js/app.js');

describe('App Logic', () => {

    // Mock the DOM
    document.body.innerHTML = `
        <div id="timerDisplay"></div>
        <div id="timerProgressBar"></div>
        <div id="timerStatus"></div>
        <div id="notification-container"></div>
    `;

    describe('interpolateScript', () => {
        test('replaces basic variables', () => {
            App.state.positiveTeamName = 'PosTeam';
            App.state.negativeTeamName = 'NegTeam';
            App.state.debateTopic = 'TheTopic';

            const script = 'Welcome {{positive_team_name}} and {{negative_team_name}} to discuss {{debate_topic}}';
            const result = App.interpolateScript(script);
            expect(result).toBe('Welcome PosTeam and NegTeam to discuss TheTopic');
        });

        test('replaces player variables', () => {
            App.state.positiveTeamPlayers = ['P1', 'P2', 'P3'];
            const script = 'Speaker is {{positive_player_1}}';
            const result = App.interpolateScript(script);
            expect(result).toBe('Speaker is P1');
        });

        test('handles missing variables gracefully', () => {
            const script = 'Hello {{unknown_var}}';
            const result = App.interpolateScript(script);
            expect(result).toBe('Hello {{unknown_var}}');
        });

        test('replaces rebuttal order variables', () => {
            App.state.positiveTeamName = 'PosTeam';
            App.state.negativeTeamName = 'NegTeam';
            App.state.rebuttalOrder = 'positive';

            const script = 'First: {{first_rebuttal_team_name}}, Second: {{second_rebuttal_team_name}}';
            const result = App.interpolateScript(script);
            expect(result).toBe('First: PosTeam, Second: NegTeam');
        });
    });

    describe('formatTime', () => {
        test('formats seconds correctly', () => {
            expect(App.formatTime(0)).toBe('00:00');
            expect(App.formatTime(9)).toBe('00:09');
            expect(App.formatTime(60)).toBe('01:00');
            expect(App.formatTime(65)).toBe('01:05');
            expect(App.formatTime(3600)).toBe('60:00');
        });

        test('handles negative seconds', () => {
            expect(App.formatTime(-1)).toBe('00:00');
        });

        test('caches results', () => {
            App._timeCache.clear();
            const t1 = App.formatTime(123);
            expect(App._timeCache.has(123)).toBe(true);
            expect(App._timeCache.get(123)).toBe('02:03');
        });
    });

    describe('getTimerState', () => {
        test('returns normal state', () => {
            expect(App.getTimerState(40, 180)).toBe('normal');
            expect(App.getTimerState(10, 20)).toBe('normal'); // Duration too short for danger
        });

        test('returns warning state', () => {
            expect(App.getTimerState(29, 180)).toBe('warning');
            expect(App.getTimerState(11, 180)).toBe('warning');
        });

        test('returns danger state', () => {
            expect(App.getTimerState(10, 180)).toBe('danger');
            expect(App.getTimerState(0, 180)).toBe('danger');
        });
    });

    describe('getTeamForStage', () => {
        beforeEach(() => {
            App.state.positiveTeamName = '正方';
            App.state.negativeTeamName = '反方';
        });

        test('identifies positive team from name', () => {
            expect(App.getTeamForStage({ name: '正方一辯申論' })).toBe('positive');
        });

        test('identifies negative team from name', () => {
            expect(App.getTeamForStage({ name: '反方一辯申論' })).toBe('negative');
        });

        test('returns choosingTeam if present', () => {
            expect(App.getTeamForStage({ choosingTeam: 'negative', name: 'Random Stage' })).toBe('negative');
        });

        test('returns null if no match', () => {
            expect(App.getTeamForStage({ name: '裁判講評' })).toBeNull();
        });

        test('handles rebuttal order logic', () => {
            App.state.rebuttalOrder = 'positive';
            expect(App.getTeamForStage({ name: '先結辯方結辯' })).toBe('positive');
            expect(App.getTeamForStage({ name: '後結辯方結辯' })).toBe('negative');
        });
    });

    describe('Timer Logic (Integration-like)', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.spyOn(global, 'setInterval');
            App.clearAllTimers();
            App.state.timer.timeLeft = 0;
            App.state.timer.initialDuration = 0;
            App.state.isAutoMode = false;
            // Mock DOM elements again just in case
            document.body.innerHTML = `
                <div id="timerDisplay"></div>
                <div id="timerProgressBar"></div>
                <div id="timerStatus"></div>
                <div id="notification-container"></div>
            `;
            // Mock playSound
            App.playRingSound = jest.fn();
            App.playSound = jest.fn();
            // Mock speak
            App.speak = jest.fn((text, cb) => { if(cb) cb(); });
            // Mock renderDebateControls
            App.renderDebateControls = jest.fn();
        });

        afterEach(() => {
            jest.useRealTimers();
            jest.restoreAllMocks();
        });

        test('startMainSpeechTimer sets up timer correctly', () => {
            App.state.currentFlow = [{ timerLabel: 'Test Stage' }];
            App.state.currentStageIndex = 0;

            App.startMainSpeechTimer(100);

            expect(App.state.timer.type).toBe('main');
            expect(App.state.timer.timeLeft).toBe(100);
            expect(App.state.timer.initialDuration).toBe(100);
            expect(setInterval).toHaveBeenCalled();
            expect(document.getElementById('timerDisplay').textContent).toBe('01:40');
        });

        test('runTimerInterval counts down and triggers end', () => {
            App.state.currentFlow = [{ timerLabel: 'Test Stage', duration: 10 }];
            App.state.currentStageIndex = 0;

            App.startMainSpeechTimer(3);

            // 2 seconds left
            jest.advanceTimersByTime(1000);
            expect(App.state.timer.timeLeft).toBe(2);
            expect(document.getElementById('timerDisplay').textContent).toBe('00:02');

            // 1 second left
            jest.advanceTimersByTime(1000);
            expect(App.state.timer.timeLeft).toBe(1);

            // 0 seconds left - End
            jest.advanceTimersByTime(1000);
            expect(App.state.timer.timeLeft).toBe(0);
            expect(App.playRingSound).toHaveBeenCalledWith(3); // Ring 3 times
            expect(App.state.timer.interval).toBeNull(); // Timer cleared
        });

        test('startGracePeriodTimer sets up grace timer', () => {
             App.state.currentFlow = [{ timerLabel: 'Test Stage', graceDuration: 30 }];
             App.state.currentStageIndex = 0;
             App.state.customGraceDuration = 60;

             App.startGracePeriodTimer(App.state.currentFlow[0]);

             expect(App.state.timer.type).toBe('grace');
             expect(App.state.timer.timeLeft).toBe(30);
             expect(document.getElementById('timerStatus').textContent).toContain('準備');
        });
    });
});
