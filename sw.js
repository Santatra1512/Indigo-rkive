/* ============================================================
   NAMJOONING — Service Worker (sw.js)
   Caches the app shell for offline viewing
   ============================================================ */

const CACHE_NAME = 'namjooning-v1';

const ASSETS_TO_CACHE = [
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* Install: pre-cache all app-shell assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('SW: Some assets failed to cache.', err);
      });
    })
  );
  self.skipWaiting();
});

/* Activate: clear old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* Fetch: cache-first for app shell, network-first for external */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin requests (e.g. Google Fonts)
  if (event.request.method !== 'GET') return;

  if (url.origin === self.location.origin) {
    // Cache-first for our own files
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => caches.match('/index.html'));
      })
    );
  }
  // External requests (fonts, APIs) pass through normally
});
