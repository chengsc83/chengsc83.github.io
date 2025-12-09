const CACHE_NAME = 'debate-clock-v2.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './display.html',
  './formal_timer.html',
  './manifest.json',
  './favicon.svg',
  './ring.m4a',
  './og-image.png'
];

// 安裝 Service Worker 並快取靜態資源
self.addEventListener('install', (event) => {
  console.log('SW: Installing v2.0...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 使用 addAll 但允許個別檔案失敗
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => {
            console.warn(`Failed to cache: ${url}`, err);
          })
        )
      );
    })
  );
  // 強制新的 Service Worker 立即啟用
  self.skipWaiting();
});

// 攔截網路請求 (優先使用快取，若無則請求網路)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// 更新 Service Worker 時清除舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});
