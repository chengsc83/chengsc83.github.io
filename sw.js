const CACHE_NAME = 'debate-clock-v3.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './display.html',
  './widget.html',
  './manifest.json',
  './favicon.svg',
  './ring.m4a',
  './og-image.png',
  // 程式碼與樣式（原本缺漏，導致離線白屏）
  './app.js',
  './piper-worker.js',
  // 樣式：app.css（進入點，@import 串接以下兩者）／app.tw.css（Tailwind v4 utilities）／style.css（手寫，保持原樣）
  './app.css',
  './app.tw.css',
  './style.css',
  './site.css',
  './debateFormatGroups.json'
];

// 安裝 Service Worker 並快取靜態資源
self.addEventListener('install', (event) => {
  console.log(`SW: Installing ${CACHE_NAME}...`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn(`Failed to cache: ${url}`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// 判斷是否為「自家程式碼資源」：同源的導航、html / js / css / json
// 這類資源採 network-first，確保線上時永遠拿到最新版本（改 code 一上線就生效）
function isOwnCodeAsset(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (request.mode === 'navigate') return true;
  return /\.(html|js|css|json)$/i.test(url.pathname);
}

// 攔截網路請求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (isOwnCodeAsset(request, url)) {
    // network-first：線上抓最新並順手更新快取；離線才回退到快取，導航再退到 app.html
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 僅快取成功且非導航（避免把帶 ?flow= 查詢字串的頁面塞進快取）的回應
          if (response && response.ok && request.mode !== 'navigate') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.mode === 'navigate') return caches.match('./app.html');
            return Response.error();
          })
        )
    );
    return;
  }

  // 其餘資源（圖片、音檔、字型、CDN 函式庫…）：先查快取（實際只有 install 預快取的
  // 自家資源會命中），未命中走網路且「不落地快取」。
  // 已知限制（刻意接受）：CDN 函式庫（transformers.js / piper / onnxruntime / Sortable /
  // qrcodejs…）不被 SW 快取，離線時 Whisper 轉錄、口播、語音偵測等功能無法載入，
  // 只能仰賴瀏覽器 HTTP cache。若要補這個缺口，方案是對 esm.run / cdn.jsdelivr.net
  // 加 stale-while-revalidate 專用快取（曾有半成品，2026-07 決策移除）。
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('./app.html');
        }
        return Response.error();
      });
    })
  );
});

// 更新 Service Worker 時清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          // [FIX] 只清理「自家」的舊版快取（debate-clock- 前綴）。
          // 原本會刪除所有非 CACHE_NAME 的快取——包含 transformers-cache（Whisper 模型，
          // 由 transformers.js 自管）——每次 SW 升版都把使用者下載的模型整批清掉，
          if (key.startsWith('debate-clock-') && key !== CACHE_NAME) {
            return caches.delete(key);
          }
          // [一次性清理] WebLLM「AI 生成流程」功能已於 2026-07 移除，
          // 遺留的模型快取（webllm/model 最大可達數 GB）順手釋放本機空間
          if (key.startsWith('webllm/')) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// PWABuilder 建議功能：後台同步 (Background Sync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-debate-data') {
    event.waitUntil(
      Promise.resolve()
    );
  }
});

// PWABuilder 建議功能：週期性同步 (Periodic Sync)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-debate-content') {
    event.waitUntil(
      Promise.resolve()
    );
  }
});

// PWABuilder 建議功能：推播通知 (Push Notifications)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '辯時計有了新通知！',
    icon: './favicon.svg',
    badge: './favicon.svg'
  };

  event.waitUntil(
    self.registration.showNotification('辯時計', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./app.html')
  );
});

// PWABuilder 建議功能：Widget Events (小部件)
if ('widgets' in self) {
  self.addEventListener('widgetinstall', event => {
    event.waitUntil(
      self.widgets.updateByTag(event.widget.tag, {
        data: JSON.stringify({
          title: "辯時計",
          status: "系統已就緒，請開啟應用程式進行比賽。"
        })
      })
    );
  });

  self.addEventListener('widgetresume', event => {
    event.waitUntil(
      self.widgets.updateByTag(event.widget.tag, {
        data: JSON.stringify({
          title: "辯時計",
          status: "請開啟應用程式查看目前進度。"
        })
      })
    );
  });

  self.addEventListener('widgetclick', event => {
    if (event.action === 'openApp') {
      event.waitUntil(clients.openWindow('./app.html'));
    }
  });
}
