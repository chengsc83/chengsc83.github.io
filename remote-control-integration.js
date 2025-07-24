/**
 * 將遠端控制功能整合到辯時計主程式
 */
(function() {
    // 等待主程式DOM載入完成
    document.addEventListener('DOMContentLoaded', function() {
        // 載入遠端控制UI
        loadRemoteControlUI();

        // 設定遠端控制命令處理器
        setupRemoteCommandHandler();

        // 定期發送狀態更新給遠端控制器
        setupStateUpdates();
        
        // 添加選單項目
        addRemoteControlMenuItem();
    });

    /**
     * 載入遠端控制UI
     */
    function loadRemoteControlUI() {
        fetch('remote-control-ui.html')
            .then(response => response.text())
            .then(html => {
                // 將UI元素插入到頁面中
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                document.body.appendChild(tempDiv.querySelector('#remoteControlHostPanel'));
                
                // 綁定UI事件
                bindRemoteControlEvents();
            })
            .catch(error => console.error('無法載入遠端控制UI:', error));
    }

    /**
     * 綁定遠端控制UI事件
     */
    function bindRemoteControlEvents() {
        const hostPanel = document.getElementById('remoteControlHostPanel');
        const startRemoteHostBtn = document.getElementById('startRemoteHostButton');
        const stopRemoteHostBtn = document.getElementById('stopRemoteHostButton');
        const copyCodeButton = document.getElementById('copyCodeButton');
        const closeBtn = hostPanel?.querySelector('.close-panel-btn');
        const remoteConnectionCode = document.getElementById('remoteConnectionCode');
        const remoteConnectionStatus = document.getElementById('remoteConnectionStatus');
        const qrCodePlaceholder = document.getElementById('qrCodePlaceholder');
        const qrCodeImage = document.getElementById('qrCodeImage');

        // 關閉面板
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                hostPanel.classList.add('hidden');
            });
        }

        // 啟動遠端主機
        if (startRemoteHostBtn) {
            startRemoteHostBtn.addEventListener('click', async function() {
                const roomCode = window.remoteControl.initAsHost();
                
                if (remoteConnectionCode) {
                    remoteConnectionCode.textContent = roomCode;
                }
                
                // 切換按鈕顯示
                startRemoteHostBtn.classList.add('hidden');
                stopRemoteHostBtn.classList.remove('hidden');
                
                // 生成QR碼
                try {
                    const qrDataUrl = await window.remoteControl.generateQRCode();
                    if (qrCodeImage && qrDataUrl) {
                        qrCodeImage.src = qrDataUrl;
                        qrCodeImage.classList.remove('hidden');
                        qrCodePlaceholder.classList.add('hidden');
                    }
                } catch (error) {
                    console.error('QR碼生成失敗:', error);
                    if (qrCodePlaceholder) {
                        qrCodePlaceholder.innerHTML = '<span style="color: #ef4444;">QR碼生成失敗</span>';
                    }
                }
            });
        }

        // 停止遠端主機
        if (stopRemoteHostBtn) {
            stopRemoteHostBtn.addEventListener('click', function() {
                window.remoteControl.disconnect();
                
                // 切換按鈕顯示
                startRemoteHostBtn.classList.remove('hidden');
                stopRemoteHostBtn.classList.add('hidden');
                
                // 重置UI
                if (remoteConnectionCode) {
                    remoteConnectionCode.textContent = '------';
                }
                
                if (qrCodeImage) {
                    qrCodeImage.classList.add('hidden');
                    qrCodePlaceholder.classList.remove('hidden');
                    qrCodePlaceholder.innerHTML = `<svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>生成中...</span>`;
                }
            });
        }

        // 複製連接碼
        if (copyCodeButton) {
            copyCodeButton.addEventListener('click', function() {
                const code = remoteConnectionCode.textContent;
                if (code && code !== '------') {
                    navigator.clipboard.writeText(code).then(() => {
                        // 顯示複製成功的反饋
                        if (window.ui && window.ui.notify) {
                            window.ui.notify('連接碼已複製到剪貼簿', 'success');
                        }
                    }).catch(err => {
                        console.error('複製失敗:', err);
                    });
                }
            });
        }

        // 處理連接狀態變化
        document.addEventListener('remoteControl:statusChange', function(e) {
            const status = e.detail;
            
            if (remoteConnectionStatus) {
                const statusDot = remoteConnectionStatus.querySelector('.status-dot');
                const statusText = remoteConnectionStatus.querySelector('.status-text');
                
                if (statusDot) {
                    statusDot.className = 'status-dot';
                    statusDot.classList.add(status);
                }
                
                if (statusText) {
                    switch (status) {
                        case 'connected':
                            statusText.textContent = '已連接';
                            break;
                        case 'connecting':
                            statusText.textContent = '連接中...';
                            break;
                        case 'disconnected':
                            statusText.textContent = '未連接';
                            break;
                        case 'error':
                            statusText.textContent = '連接錯誤';
                            break;
                    }
                }
            }
        });
    }

    /**
     * 設定遠端命令處理器
     */
    function setupRemoteCommandHandler() {
        if (window.remoteControl) {
            window.remoteControl.onCommandReceived = function(action, params) {
                console.log('收到遠端命令:', action, params);
                
                switch(action) {
                    case 'nextStage':
                        // 觸發下一階段按鈕
                        document.getElementById('nextStageButton')?.click();
                        break;
                        
                    case 'pauseResume':
                        // 觸發暫停/繼續按鈕
                        document.getElementById('pauseResumeTimerButton')?.click();
                        break;
                        
                    case 'manualStart':
                        // 觸發手動開始按鈕或強制開始計時
                        document.getElementById('manualStartTimerButton')?.click() || 
                        document.getElementById('forceStartMainTimerButton')?.click();
                        break;
                        
                    case 'skip':
                        // 觸發跳過按鈕
                        document.getElementById('skipStageButton')?.click();
                        break;
                }
            };
        }
    }

    /**
     * 設定狀態更新
     */
    function setupStateUpdates() {
        // 每秒更新狀態
        setInterval(function() {
            if (!window.remoteControl || !window.remoteControl.isHost) return;
            
            const state = collectCurrentState();
            window.remoteControl.updateState(state);
        }, 500);
    }

    /**
     * 收集目前狀態
     */
    function collectCurrentState() {
        const state = {
            currentStageName: document.getElementById('currentStageInfo')?.textContent || '未開始',
            teams: {
                positive: window.positiveTeamName || '正方',
                negative: window.negativeTeamName || '反方'
            },
            timer: {
                display: document.getElementById('timerDisplay')?.textContent || '00:00',
                status: document.getElementById('timerStatus')?.textContent || '準備中',
                isPaused: window.isTimerPaused || false,
                warning: getTimerWarningState()
            },
            buttons: {
                nextEnabled: !document.getElementById('nextStageButton')?.disabled,
                pauseEnabled: !document.getElementById('pauseResumeTimerButton')?.disabled,
                manualStartEnabled: !document.getElementById('manualStartTimerButton')?.disabled,
                skipEnabled: !document.getElementById('skipStageButton')?.disabled
            }
        };
        
        return state;
    }

    /**
     * 獲取計時器警告狀態
     */
    function getTimerWarningState() {
        const timerDisplay = document.getElementById('timerDisplay');
        if (!timerDisplay) return null;
        
        if (timerDisplay.classList.contains('timesup')) {
            return 'danger';
        } else if (timerDisplay.classList.contains('warning30sec')) {
            return 'danger';
        } else if (timerDisplay.classList.contains('warning1min')) {
            return 'warning';
        }
        return null;
    }

    /**
     * 添加選單項目
     */
    function addRemoteControlMenuItem() {
        const menuSection = document.querySelector('.menu-section');
        if (!menuSection) return;
        
        const newItem = document.createElement('button');
        newItem.className = 'menu-item';
        newItem.id = 'menuRemoteControl';
        newItem.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
            </svg>
            <span>遠端控制模式</span>
        `;
        
        // 將項目添加到第一個選單區塊的末尾
        menuSection.appendChild(newItem);
        
        // 綁定事件
        newItem.addEventListener('click', function() {
            const hostPanel = document.getElementById('remoteControlHostPanel');
            if (hostPanel) {
                hostPanel.classList.remove('hidden');
                if (document.getElementById('hamburgerMenu').classList.contains('active')) {
                    document.getElementById('closeMenuButton')?.click();
                }
            }
        });
    }
})();