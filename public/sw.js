const CACHE_NAME = 'pg-manager-cache-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  'https://img.icons8.com/color/192/hostel.png',
  'https://img.icons8.com/color/512/hostel.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use try-catch or map to prevent addAll failures if icons fail to load
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Failed to pre-cache some assets:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests and bypass API endpoints
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // Network-First Strategy: Attempt live network fetch first
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (!res || res.status !== 200 || res.type !== 'basic') {
          return res;
        }
        const responseToCache = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return res;
      })
      .catch(() => {
        // Fallback to cache if network is offline
        return caches.match(event.request);
      })
  );
});
