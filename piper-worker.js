/**
 * Piper TTS Web Worker
 * 在背景線程執行 ONNX 語音合成，避免阻塞主線程 UI。
 * 
 * 訊息格式：
 *   主線程 → Worker:
 *     { type: 'load', id, voiceId }
 *     { type: 'predict', id, text, voiceId }
 *   Worker → 主線程:
 *     { type: 'loaded', id }
 *     { type: 'result', id, wav: ArrayBuffer }
 *     { type: 'error', id, error: string }
 *     { type: 'progress', id, loaded, total }
 */

let ttsModule = null;

self.onmessage = async (e) => {
    const { type, id, voiceId, text } = e.data;

    if (type === 'load') {
        try {
            if (ttsModule) {
                self.postMessage({ type: 'loaded', id });
                return;
            }

            const tts = await import('https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web/+esm');

            // 檢查模型是否已快取
            const stored = await tts.stored();
            if (!stored.includes(voiceId)) {
                await tts.download(voiceId, (progress) => {
                    if (progress.total > 0) {
                        self.postMessage({ type: 'progress', id, loaded: progress.loaded, total: progress.total });
                    }
                });
            }

            ttsModule = tts;
            self.postMessage({ type: 'loaded', id });
        } catch (err) {
            self.postMessage({ type: 'error', id, error: err.message || String(err) });
        }
    }

    if (type === 'predict') {
        try {
            if (!ttsModule) {
                self.postMessage({ type: 'error', id, error: 'TTS not loaded' });
                return;
            }

            const wav = await ttsModule.predict({ text, voiceId });
            // 將 Blob 轉為 ArrayBuffer 傳回主線程（可 transfer）
            const arrayBuffer = await wav.arrayBuffer();
            self.postMessage({ type: 'result', id, wav: arrayBuffer }, [arrayBuffer]);
        } catch (err) {
            self.postMessage({ type: 'error', id, error: err.message || String(err) });
        }
    }
};
