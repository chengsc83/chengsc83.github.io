/**
 * UI Enhancement Module for VD2 Debate Timer
 * 提供進階的用戶介面增強功能
 */

class UIEnhancements {
    constructor() {
        this.isInitialized = false;
        this.observers = new Map();
        this.init();
    }

    /**
     * 初始化所有 UI 增強功能
     */
    init() {
        if (this.isInitialized) return;
        
        document.addEventListener('DOMContentLoaded', () => {
            this.hideLoader();
            this.initIntersectionObserver();
            this.initSmoothScrolling();
            this.initTooltips();
            this.initKeyboardNavigation();
            this.initFormEnhancements();
            this.initButtonEffects();
            this.initNotificationSystem();
        });
        
        this.isInitialized = true;
        console.log('🎨 UI Enhancements initialized successfully');
    }

    /**
     * 隱藏載入畫面
     */
    hideLoader() {
        const loader = document.getElementById('appLoader');
        if (loader) {
            setTimeout(() => {
                loader.classList.add('hidden');
            }, 500);
        }
    }

    /**
     * 初始化 Intersection Observer 以實現元素進場動畫
     */
    initIntersectionObserver() {
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = `${Math.random() * 200}ms`;
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
        this.observers.set('intersection', observer);
    }

    /**
     * 平滑滾動功能
     */
    initSmoothScrolling() {
        document.documentElement.style.scrollBehavior = 'smooth';
    }

    /**
     * 工具提示功能增強
     */
    initTooltips() {
         document.body.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target && !target._tooltip) {
                this.showTooltip(target);
            }
        });
    }

    showTooltip(element) {
        const tooltipText = element.dataset.tooltip;
        if (!tooltipText) return;

        const tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip-popup';
        tooltipEl.textContent = tooltipText;
        document.body.appendChild(tooltipEl);
        element._tooltip = tooltipEl;

        const rect = element.getBoundingClientRect();
        tooltipEl.style.left = `${rect.left + rect.width / 2 - tooltipEl.offsetWidth / 2}px`;
        tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 8}px`;

        requestAnimationFrame(() => {
            tooltipEl.style.opacity = '1';
            tooltipEl.style.transform = 'translateY(0)';
        });

        const hide = () => this.hideTooltip(element);
        element.addEventListener('mouseleave', hide, { once: true });
        element.addEventListener('click', hide, { once: true });
    }

    hideTooltip(element) {
        const tooltip = element._tooltip;
        if (tooltip) {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(5px)';
            setTimeout(() => tooltip.remove(), 200);
            delete element._tooltip;
        }
    }

    /**
     * 鍵盤導航增強
     */
    initKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') document.body.classList.add('keyboard-navigation');
        });
        document.addEventListener('mousedown', () => document.body.classList.remove('keyboard-navigation'));
    }

    /**
     * 表單增強功能
     */
    initFormEnhancements() {
        document.querySelectorAll('.file-upload-area').forEach(area => {
            area.addEventListener('dragover', (e) => { e.preventDefault(); area.classList.add('dragover'); });
            area.addEventListener('dragleave', () => area.classList.remove('dragover'));
            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('dragover');
                const input = area.querySelector('input[type="file"]');
                if (input && e.dataTransfer.files.length > 0) {
                    input.files = e.dataTransfer.files;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        });
    }

    /**
     * 按鈕效果增強
     */
    initButtonEffects() {
        document.body.addEventListener('click', (e) => {
            const button = e.target.closest('.btn');
            if (button) this.createRippleEffect(e, button);
        });
    }

    createRippleEffect(event, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
        ripple.classList.add('ripple-effect');
        button.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }
    
    /**
     * 通知系統
     */
    initNotificationSystem() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.className = 'notification-container';
        document.body.appendChild(this.notificationContainer);
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `<span>${message}</span>`;
        this.notificationContainer.appendChild(notification);
        
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, duration);
    }
}

/**
 * 專門針對辯論計時器的增強功能
 */
class DebateTimerEnhancements {
    constructor() {
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.vibrationEnabled = localStorage.getItem('vibrationEnabled') !== 'false';
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.createSoundControlPanel();
            this.createFullscreenUI();
            this.initFullscreenEnhancements();
        });
        console.log('🏆 Debate Timer Enhancements initialized');
    }

    /**
     * 音效與觸覺回饋控制面板
     */
    createSoundControlPanel() {
        const container = document.getElementById('soundControlsContainer');
        if (!container) return;

        container.innerHTML = `
            <h4 style="margin-top: 0; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; font-weight: 600;">
                <span>🔊</span> 音效與反饋
            </h4>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <label class="toggle-switch-label">
                    <span class="toggle-label-text">啟用音效</span>
                    <label class="toggle-switch enhanced-toggle">
                        <input type="checkbox" id="soundToggle" ${this.soundEnabled ? 'checked' : ''}>
                        <span class="toggle-slider"><span class="toggle-thumb"></span></span>
                    </label>
                </label>
                <label class="toggle-switch-label">
                    <span class="toggle-label-text">觸覺反饋 (行動裝置)</span>
                    <label class="toggle-switch enhanced-toggle">
                        <input type="checkbox" id="vibrationToggle" ${this.vibrationEnabled ? 'checked' : ''}>
                        <span class="toggle-slider"><span class="toggle-thumb"></span></span>
                    </label>
                </label>
            </div>
        `;

        document.getElementById('soundToggle').addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            localStorage.setItem('soundEnabled', this.soundEnabled);
            if(this.soundEnabled && window.ui) window.ui.notify('音效已啟用', 'info');
        });
        
        document.getElementById('vibrationToggle').addEventListener('change', (e) => {
            this.vibrationEnabled = e.target.checked;
            localStorage.setItem('vibrationEnabled', this.vibrationEnabled);
            if(this.vibrationEnabled && window.ui) window.ui.notify('觸覺回饋已啟用', 'info');
        });
    }

    /**
     * 全螢幕模式增強與通知
     */
    initFullscreenEnhancements() {
        document.addEventListener('fullscreenchange', () => {
            const isFullscreen = !!document.fullscreenElement;
            document.body.classList.toggle('fullscreen-active', isFullscreen);
            
            if (isFullscreen) {
                if (window.ui) window.ui.notify('🖥️ 已進入全螢幕模式', 'info');
            } else {
                if (window.ui) window.ui.notify('🪟 已退出全螢幕模式', 'info');
            }
        });
    }

    /**
     * 全螢幕模式底下的控制列
     */
    createFullscreenUI() {
        const fullscreenControls = document.createElement('div');
        fullscreenControls.className = 'fullscreen-controls';
        fullscreenControls.innerHTML = `
            <button class="btn btn-ghost btn-icon" id="fs-play-pause" title="播放/暫停 (P)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon" id="fs-next" title="下一階段 (N)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </button>
            <button class="btn btn-ghost btn-icon" id="fs-exit" title="退出全螢幕 (Esc)">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9V4.5M15 9h4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15v4.5M15 15h4.5m0 0l5.25 5.25"/></svg>
            </button>
        `;
        document.body.appendChild(fullscreenControls);

        // 為控制列按鈕綁定功能
        document.getElementById('fs-exit').addEventListener('click', () => document.exitFullscreen());
        document.getElementById('fs-play-pause').addEventListener('click', () => {
            document.getElementById('pauseResumeTimerButton')?.click();
        });
        document.getElementById('fs-next').addEventListener('click', () => {
             document.getElementById('nextStageButton')?.click();
        });
    }
}

// 全局實例化
window.UIEnhancements = new UIEnhancements();
window.DebateTimerEnhancements = new DebateTimerEnhancements();

// 提供一個簡單的 API 給其他腳本使用
window.ui = {
    notify: (message, type) => window.UIEnhancements.showNotification(message, type)
};

// 添加必要的 CSS
const additionalStyles = `
/* 載入與動畫 */
.fade-in { opacity: 0; transform: translateY(20px); transition: all 0.5s ease-out; }
.fade-in.visible { opacity: 1; transform: translateY(0); }
.ripple-effect { position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.4); transform: scale(0); animation: ripple 0.6s linear; pointer-events: none; }
@keyframes ripple { to { transform: scale(4); opacity: 0; } }

/* 工具提示 */
.tooltip-popup { position: fixed; background: #333; color: white; padding: 6px 12px; border-radius: 4px; font-size: 0.875rem; z-index: 10001; pointer-events: none; opacity: 0; transform: translateY(5px); transition: opacity 0.2s, transform 0.2s; }

/* 鍵盤導航 */
.keyboard-navigation *:focus { outline: 2px solid var(--primary-color); outline-offset: 2px; }

/* 檔案上傳拖曳 */
.file-upload-area.dragover { border-color: var(--primary-color); background-color: rgba(37, 99, 235, 0.05); }

/* 音效與回饋開關 */
.toggle-switch-label { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; }
.toggle-label-text { font-weight: 500; color: var(--text-secondary); }

/* 全螢幕控制列 */
.fullscreen-controls { 
    position: fixed; 
    bottom: -100px; /* 初始隱藏 */
    left: 50%; 
    transform: translateX(-50%); 
    background: var(--glass-bg); 
    backdrop-filter: var(--glass-backdrop); 
    border: 1px solid var(--glass-border); 
    border-radius: var(--rounded-2xl); 
    padding: 0.75rem 1.5rem; 
    display: flex; 
    gap: 1rem; 
    align-items: center; 
    z-index: 1000; 
    box-shadow: var(--shadow-elevated);
    transition: bottom 0.3s ease-in-out;
}
body.fullscreen-active .fullscreen-controls {
    bottom: 2rem; /* 進入全螢幕時顯示 */
}
.fullscreen-controls .btn-icon svg { width: 1.75rem; height: 1.75rem; }

/* 通知系統 */
.notification-container { position: fixed; top: 80px; right: 20px; z-index: 10002; display: flex; flex-direction: column; gap: 0.5rem; }
.notification { background: var(--glass-bg); backdrop-filter: var(--glass-backdrop); border: 1px solid var(--glass-border); border-left-width: 4px; border-radius: var(--rounded-lg); padding: 1rem 1.5rem; color: var(--color-text-primary); box-shadow: var(--shadow-elevated); transition: all 0.3s ease-in-out; transform: translateX(120%); }
.notification.show { transform: translateX(0); }
.notification-info { border-left-color: var(--color-info-500); }
.notification-success { border-left-color: var(--color-success-500); }
.notification-error { border-left-color: var(--color-danger-500); }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = additionalStyles;
document.head.appendChild(styleSheet);