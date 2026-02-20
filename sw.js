const CACHE_NAME = 'lineconic-v2';
const PRECACHE = [
  '/app',
  '/app.html',
  '/ros-v1.json',
  'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip caching for Firebase API requests
  if (url.hostname.includes('firebasedatabase.app')) return;
  if (url.hostname.includes('identitytoolkit.googleapis.com')) return;
  if (url.hostname.includes('securetoken.googleapis.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache Google Fonts font files and Firebase SDK
        if (
          url.hostname === 'fonts.gstatic.com' ||
          url.hostname === 'fonts.googleapis.com' ||
          url.hostname === 'www.gstatic.com'
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
