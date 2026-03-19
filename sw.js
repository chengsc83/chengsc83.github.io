const CACHE_NAME = 'debate-clock-v2.4c';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './display.html',
  './manifest.json',
  './favicon.svg',
  './ring.m4a',
  './og-image.png',
  './style.css',
  './app.js',
  './piper-worker.js',
  './widget/timer-widget.json',
  './widget/timer-data.json'
];

// ==================== 安裝 ====================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v2.4c...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url =>
          cache.add(url).catch(err => {
            console.warn(`[SW] Failed to cache: ${url}`, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ==================== 啟用（清除舊快取）====================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ==================== 攔截請求（快取優先）====================
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// ==================== 訊息處理 ====================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ==================== Widget 支援 ====================

// Widget 安裝事件
self.addEventListener('widgetinstall', (event) => {
  event.waitUntil(updateWidget(event));
});

// Widget 點擊事件
self.addEventListener('widgetclick', (event) => {
  if (event.action === 'open_app') {
    event.waitUntil(
      clients.openWindow('./app.html')
    );
  }
});

// Widget 恢復事件（系統重啟後）
self.addEventListener('widgetresume', (event) => {
  event.waitUntil(updateWidget(event));
});

// 週期性同步（背景更新 Widget）
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'widget-update') {
    event.waitUntil(updateAllWidgets());
  }
});

/**
 * 更新單個 Widget
 */
async function updateWidget(event) {
  try {
    // 從快取或網路取得 Widget 模板
    const templateResponse = await caches.match('./widget/timer-widget.json') ||
                              await fetch('./widget/timer-widget.json');
    const template = await templateResponse.text();

    // 從快取或網路取得 Widget 資料
    const dataResponse = await caches.match('./widget/timer-data.json') ||
                          await fetch('./widget/timer-data.json');
    const data = await dataResponse.text();

    // 使用 Widget API 更新
    if (self.widgets) {
      await self.widgets.updateByTag('debate-timer-widget', { template, data });
    }
  } catch (err) {
    console.warn('[SW] Widget update failed:', err);
  }
}

/**
 * 更新所有 Widget
 */
async function updateAllWidgets() {
  if (!self.widgets) return;

  try {
    const widgetList = await self.widgets.getByTag('debate-timer-widget');
    if (widgetList && widgetList.length > 0) {
      await updateWidget({ tag: 'debate-timer-widget' });
    }
  } catch (err) {
    console.warn('[SW] Widget batch update failed:', err);
  }
}

// ==================== 推播通知（可選）====================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || '辯時計', {
      body: data.body || '',
      icon: './favicon.svg',
      badge: './favicon.svg',
      tag: 'debate-timer-notification'
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./app.html')
  );
});
