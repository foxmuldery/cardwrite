/* 老袁编剧卡片系统 · 离线缓存 */
const VERSION = 'cardwrite-v1.0.0';
const APP_SHELL = [
  './',
  './index.html',
  './assets/app.css',
  './assets/app.js',
  './assets/vendor/sortable.min.js',
  './manifest.webmanifest',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[sw] 预缓存失败', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航：优先网络，断网时回退到缓存的首页
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(VERSION).then(cache => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true })
          .then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // 静态资源：缓存优先，后台静默更新
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then(hit => {
      const network = fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(VERSION).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => hit);
      return hit || network;
    })
  );
});
