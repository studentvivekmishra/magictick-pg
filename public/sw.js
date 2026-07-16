const CACHE_NAME = 'pg-manager-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  'https://img.icons8.com/color/192/hostel.png',
  'https://img.icons8.com/color/512/hostel.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests and bypass browser extensions or API calls to ensure standard JWT requests bypass caching
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') {
          return res;
        }
        const responseToCache = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return res;
      }).catch(() => {
        // Fallback silently if offline
      });
    })
  );
});
