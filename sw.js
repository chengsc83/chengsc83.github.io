const CACHE_NAME = 'debate-clock-v2.4.1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './app.html',
  './display.html',
  './manifest.json',
  './favicon.svg',
  './ring.m4a',
  './og-image.png'
];

// 安裝 Service Worker 並快取靜態資源
self.addEventListener('install', (event) => {
  console.log('SW: Installing v2.3.1...');
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
