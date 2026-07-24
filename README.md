# 辯時計 — 專業辯論計時系統

**辯時計** 是一個專為中文辯論賽事設計的現代化網頁計時系統。無論是社課訓練、系際賽還是正式盃賽，都能提供穩定、專業且易於操作的計時與輔助功能。

**純前端、零後端、零帳號、免費開源。所有 AI 運算 100% 在你的裝置上完成，語音不上傳任何伺服器。**

🔗 **線上使用**：<https://chengsc83.github.io/>

---

## ✨ 核心功能

### 🎯 計時與賽制

- **內建 17 種賽制**，分為 4 大類：新式奧瑞岡（含結辯／無結辯）、新加坡制、特殊賽制（如辯革盃九辯位自由排序）。
- **流程編輯器**：新增、刪除、編輯、拖曳排序任一階段，打造完全客製的比賽流程。
- **自訂準備時間**：可自由設定每個發言前的準備緩衝（Grace Period）與逾時行為（自動開始／自動跳過／手動開始）。
- **自由辯論模式**：正反方獨立計時、一鍵換方，時間各自倒數。
- **賽制分享**：把自訂流程壓縮成短連結或 QR Code 分享給其他人一鍵匯入。
- **復原（Undo）**：誤操作可用 `Ctrl+Z` 回到上一步。

### 🤖 AI 主計（全離線）

準備時間結束後自動偵測選手開口、自動開始計時，模擬真人主計的判斷。判定鏈共四層：

1. **Silero VAD 神經網路**：逐幀輸出語音機率（ONNX，在瀏覽器端推論）。
2. **環境噪音魯棒校準**：以中位數＋MAD（中位絕對偏差）建立基線並持續滾動更新——校準期間的一聲咳嗽不會污染整場判斷；吵雜場地自動加大判定餘裕。門檻採滯後（hysteresis）雙閾值，辯士句中音量下探不會被誤判為中斷。
3. **DSP 聲學特徵融合**：頻譜平坦度、語音頻帶占比、起音峰均比、音節調變節奏四維分析，結構性排除拍手、關門、冷氣運轉等干擾。
4. **證據漏積分器**：以序貫檢定（SPRT）累積證據——洪亮的開場約 0.7 秒開錶、含糊的聲音多聽 2 秒、可疑雜音永遠積不滿。

### 🎙️ 錄音與逐字稿

- **即時語音轉錄**：以 Web Speech API 將比賽發言即時轉成文字，依階段自動分段標記發言者；自由辯論會再細分「自由辯 正方／反方」。
- **Whisper 裝置端逐字稿**：賽後可用 OpenAI Whisper（transformers.js）在**自己的裝置上**產生高精度逐字稿。優先使用 WebGPU 加速，不支援時自動退回 WASM；模型首次下載後即可離線重複使用。
- **多段錄音**：一場比賽可分多段錄製，播放器提供段落切換，每段可獨立播放、跳轉階段、下載或轉逐字稿，也可一鍵下載全部。
- **匯出**：錄音檔（`.webm` / `.m4a`）與逐字稿（`.txt`）皆可下載。

### 🔊 語音與提示

- **本地神經語音播報**：以 Piper TTS（WASM）在裝置端合成主席稿與流程提示，不需連網、不經第三方服務；失敗時自動退回瀏覽器內建 `speechSynthesis`。
- **響鈴提示**：剩 60 秒一響、剩 30 秒二響、時間到三響。
- **觸覺回饋**：Android 上鈴聲同步振動（一短震／雙震／長三震），嘈雜賽場憑觸覺即可分辨（iOS 因系統限制不支援振動，鈴聲不受影響）。
- **語音指令**：比賽中說出「系統暫停」／「系統開始」即可控制計時。

### 🖥️ 顯示與操作

- **投影模式**：另開一個計時畫面投放到外接螢幕或投影機，與主控端即時同步（`M` 鍵切換）。
- **畫中畫（PiP）**：把計時器浮在螢幕最上層，方便選手專注於稿件或其他視窗。
- **PWA 離線可用**：可安裝到桌面／主畫面，斷網也能正常計時。
- **主題切換**：亮色／暗色雙主題，適應不同場地光線。
- **響應式設計**：桌機、平板、手機皆有良好體驗。
- **多分頁保護**：以 Web Locks API 確保同時只有一個分頁進行比賽，避免互相干擾。

### ⌨️ 鍵盤快捷鍵

| 按鍵 | 功能 | 按鍵 | 功能 |
|---|---|---|---|
| `B` | 上一階段 | `F` | 切換全螢幕 |
| `N` | 下一階段 | `T` | 切換亮／暗主題 |
| `Space` / `P` | 暫停 / 繼續計時 | `M` | 切換投影模式 |
| `A` | 切換自動模式 | `Esc` | 關閉彈出視窗或側邊欄 |
| `I` | 切換畫中畫模式 | `Ctrl+Z` | 復原 |
| `R` | 重設辯論 | `?` | 顯示快捷鍵說明 |

---

## 🛠️ 技術棧

純前端應用，無需後端伺服器即可運行。

- **核心**：HTML5、CSS3、JavaScript (ES6+)，無框架
- **樣式**：[Tailwind CSS v4](https://tailwindcss.com/)（**預編譯**，非執行期 CDN JIT）＋ 手寫 CSS
  - 採用現代 CSS：原生巢狀、`light-dark()`、`color-mix()`、`@property`、Container Queries、`@starting-style`、View Transitions、原生 `<dialog>`

### 瀏覽器 API

| API | 用途 |
|---|---|
| Web Speech API | 即時語音轉錄、語音指令 |
| Web Audio API | 響鈴、TTS 播放、RMS 音量分析 |
| MediaRecorder | 比賽錄音 |
| Compression Streams | 賽制分享碼壓縮（取代 pako） |
| Picture-in-Picture | 畫中畫計時器 |
| Web Locks | 多分頁比賽衝突防護 |
| IndexedDB | TTS 語音快取 |
| Vibration | 響鈴觸覺回饋（Android） |
| Service Worker | PWA 離線快取 |
| Screen Wake Lock | 比賽中防止螢幕休眠 |

### 外部函式庫（皆由 CDN 載入）

| 函式庫 | 用途 |
|---|---|
| [@ricky0123/vad-web](https://github.com/ricky0123/vad) + [onnxruntime-web](https://onnxruntime.ai) | Silero VAD 語音偵測 |
| [@huggingface/transformers](https://github.com/huggingface/transformers.js) | Whisper 裝置端逐字稿（動態載入） |
| [piper-tts-web](https://github.com/Mintplex-Labs/piper-tts-web) | 本地神經語音合成（動態載入） |
| [Sortable.js](https://github.com/SortableJS/Sortable) | 流程編輯器拖曳排序 |
| [qrcodejs](https://github.com/davidshimjs/qrcodejs) | 賽制分享 QR Code |

> AI 模型（Silero VAD / Whisper / Piper）全部在使用者裝置上執行，**音訊不會上傳到任何伺服器**。

---

## 🚀 使用方式

### 一般使用者

直接開啟 <https://chengsc83.github.io/> 即可，無需安裝。建議使用 **Chrome 或 Edge**（語音轉錄與語音指令依賴 Web Speech API，Firefox / Safari 支援有限）。

1. **賽前設定**：填寫盃賽名稱（選填）、辯題、正反方隊名，選擇比賽流程；可在進階設定調整準備時間與語音偵測。若要修改流程，點「自訂流程」進入編輯器。
2. **開始比賽**：點「開始辯論」，依畫面主席稿提示，用「上一階段／下一階段／暫停」控制賽程，或交給自動模式。
3. **比賽結束**：畫面顯示下載選項，可下載錄音檔與逐字稿。

> 💡 首次使用語音偵測、錄音需授權麥克風；Whisper 首次轉錄需下載約 75MB 模型（之後離線可用）。

### 開發者

專案為靜態網站，但 Tailwind CSS 需要預先編譯。

```bash
# 1. 安裝相依套件
npm install

# 2. 編譯 CSS（修改 HTML/JS 的 class 或 tailwind-*.src.css 後都要重跑）
npm run build:css          # 同時編譯 app 與官網兩份
# 或分別編譯：
npm run build:css:app      # tailwind-app.src.css  → app.tw.css
npm run build:css:site     # tailwind-site.src.css → site.css

# 3. 以本機伺服器開啟（不可用 file:// 直接開，Service Worker 與模組載入會失效）
python -m http.server 8000
# 瀏覽 http://localhost:8000/app.html
```

**檔案結構**

| 檔案 | 說明 |
|---|---|
| `index.html` | 官網／介紹頁 |
| `app.html` | 計時器主程式頁面 |
| `app.js` | 應用程式主體（單一 `App` 物件） |
| `display.html` | 投影模式的外接顯示畫面 |
| `style.css` | 手寫樣式（主題、玻璃質感、動畫） |
| `app.tw.css` / `site.css` | Tailwind 編譯輸出（**勿手動編輯**） |
| `tailwind-*.src.css` | Tailwind 編譯入口與設定 |
| `debateFormatGroups.json` | 內建賽制資料 |
| `piper-worker.js` | Piper TTS 的 Web Worker |
| `sw.js` / `manifest.json` | PWA Service Worker 與應用程式資訊 |

---

## 🔭 未來展望 (Roadmap)

- [ ] **偵測演算法持續強化**：雙音訊通道包絡互相關互抑、裝置端線上學習（依操作者的手動修正微調判定權重，仍 100% 本地）。
- [ ] **逐字稿後處理**：智慧斷句、標點還原、發言者自動分離。
- [ ] **更多賽制模板**：擴充國際賽制（BP、WSDC 等）。
- [ ] **無障礙強化**：螢幕閱讀器體驗與鍵盤操作全流程覆蓋。
- [ ] **Discord Bot 整合**：把計時與提醒帶到線上辯論場景。

> 設計原則：**本地優先**。所有 AI 功能維持在裝置端執行，不引入需要上傳使用者語音的雲端服務。

---

## 🤝 貢獻

歡迎對辯論或網頁開發有熱情的夥伴一同參與！

1. **問題回報**：發現 Bug 或使用問題，請至 GitHub Issues 回報。
2. **功能建議**：有想法歡迎在 GitHub Issues 提出。
3. **程式碼貢獻**：
   - Fork 此專案
   - 建立功能分支 (`git checkout -b feature/AmazingFeature`)
   - 提交變更 (`git commit -m 'Add some AmazingFeature'`)
   - 推送分支 (`git push origin feature/AmazingFeature`)
   - 開啟 Pull Request

> 送出 PR 前請記得執行 `npm run build:css`，並確認 `app.tw.css` / `site.css` 一併提交。

---

## 🔒 隱私

辯時計不蒐集、不上傳任何比賽內容。錄音、逐字稿與所有 AI 推論皆在你的瀏覽器內完成並僅存於本機。詳見 [隱私權政策](privacy.html)。

---

## ✍️ 作者

**鄭世駿 James Cheng** — 主要開發者 — <https://github.com/chengsc83>

合作邀約或問題請聯繫：`james830.sc@gmail.com`
