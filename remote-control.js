/**
 * 辯時計 Pro - 遠端控制模式
 * 讓使用者能從另一台設備控制辯論計時器
 */
class RemoteControlManager {
    constructor() {
        this.isHost = false;
        this.isController = false;
        this.roomCode = null;
        this.connection = null;
        this.onCommandReceived = null;
        this.pingInterval = null;
        this.connectionStatus = 'disconnected'; // disconnected, connecting, connected
    }

    /**
     * 初始化為主機 (被控制端)
     */
    initAsHost() {
        if (this.connection) this.disconnect();
        this.isHost = true;
        this.isController = false;
        this.roomCode = this.generateRoomCode();
        this.setupConnection();
        return this.roomCode;
    }

    /**
     * 初始化為控制端
     * @param {string} code - 連接碼
     */
    initAsController(code) {
        if (this.connection) this.disconnect();
        this.isHost = false;
        this.isController = true;
        this.roomCode = code.toUpperCase();
        this.setupConnection();
    }

    /**
     * 建立連接
     */
    setupConnection() {
        this.updateConnectionStatus('connecting');

        // 使用安全的WebSocket連接
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsEndpoint = `${wsProtocol}//debate-timer-relay.example.com/ws`;
        
        try {
            this.connection = new WebSocket(wsEndpoint);
            
            this.connection.onopen = () => {
                // 連接建立後，發送註冊訊息
                const registerMsg = {
                    type: 'register',
                    role: this.isHost ? 'host' : 'controller',
                    roomCode: this.roomCode
                };
                this.connection.send(JSON.stringify(registerMsg));
                
                // 設定心跳包以維持連接
                this.pingInterval = setInterval(() => {
                    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
                        this.connection.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 30000);
                
                this.updateConnectionStatus('connected');
                this.triggerEvent('connected');
            };
            
            this.connection.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('Remote control message parsing error:', e);
                }
            };
            
            this.connection.onerror = (error) => {
                console.error('WebSocket Error:', error);
                this.updateConnectionStatus('error');
                this.triggerEvent('error', error);
            };
            
            this.connection.onclose = () => {
                clearInterval(this.pingInterval);
                this.updateConnectionStatus('disconnected');
                this.triggerEvent('disconnected');
            };
        } catch (e) {
            console.error('WebSocket connection failed:', e);
            this.updateConnectionStatus('error');
            this.triggerEvent('error', e);
        }
    }

    /**
     * 處理接收到的訊息
     */
    handleMessage(data) {
        switch (data.type) {
            case 'registered':
                this.triggerEvent('registered', data);
                break;
                
            case 'command':
                if (this.isHost && this.onCommandReceived) {
                    this.onCommandReceived(data.action, data.params);
                }
                this.triggerEvent('command', data);
                break;
                
            case 'state_update':
                this.triggerEvent('stateUpdate', data.state);
                break;
                
            case 'pong':
                // 心跳回應
                break;
                
            case 'error':
                console.error('Remote control error:', data.message);
                this.triggerEvent('error', data.message);
                break;
        }
    }

    /**
     * 發送遠端控制指令
     * @param {string} action - 指令類型
     * @param {object} params - 指令參數
     */
    sendCommand(action, params = {}) {
        if (!this.isController || !this.connection || this.connection.readyState !== WebSocket.OPEN) {
            return false;
        }

        const command = {
            type: 'command',
            roomCode: this.roomCode,
            action: action,
            params: params,
            timestamp: Date.now()
        };

        try {
            this.connection.send(JSON.stringify(command));
            return true;
        } catch (e) {
            console.error('Error sending command:', e);
            return false;
        }
    }

    /**
     * 發送狀態更新給控制端
     * @param {object} state - 目前狀態資訊
     */
    updateState(state) {
        if (!this.isHost || !this.connection || this.connection.readyState !== WebSocket.OPEN) {
            return false;
        }

        const stateUpdate = {
            type: 'state_update',
            roomCode: this.roomCode,
            state: state,
            timestamp: Date.now()
        };

        try {
            this.connection.send(JSON.stringify(stateUpdate));
            return true;
        } catch (e) {
            console.error('Error sending state update:', e);
            return false;
        }
    }

    /**
     * 關閉連接
     */
    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        
        clearInterval(this.pingInterval);
        this.pingInterval = null;
        
        this.updateConnectionStatus('disconnected');
        this.isHost = false;
        this.isController = false;
        this.roomCode = null;
        
        this.triggerEvent('disconnected');
    }

    /**
     * 產生隨機的六位連接碼
     */
    generateRoomCode() {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 排除容易混淆的字元
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    /**
     * 更新連接狀態
     */
    updateConnectionStatus(status) {
        this.connectionStatus = status;
        this.triggerEvent('statusChange', status);
    }

    /**
     * 觸發事件
     */
    triggerEvent(eventName, data) {
        const event = new CustomEvent('remoteControl:' + eventName, { 
            detail: data,
            bubbles: true 
        });
        document.dispatchEvent(event);
    }

    /**
     * 產生QR碼
     * @returns {Promise<string>} - QR碼的資料URL
     */
    async generateQRCode() {
        if (!this.isHost || !this.roomCode) return null;
        
        // 動態載入QR碼生成庫
        if (!window.QRCode) {
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        const url = `${window.location.origin}/remote-controller.html?code=${this.roomCode}`;
        return await QRCode.toDataURL(url, {
            margin: 1,
            width: 300,
            color: {
                dark: '#3b82f6',
                light: '#ffffff'
            }
        });
    }
}

// 匯出全域實例
window.remoteControl = new RemoteControlManager();