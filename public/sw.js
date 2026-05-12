const CACHE_NAME = 'athena-cache-v8';
const ASSETS_TO_CACHE = [
  'https://ik.imagekit.io/7e0zp2ext/GLD.png?updatedAt=1772483693392'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Do not handle navigation requests in SW to ensure browser always gets fresh index.html
  if (event.request.mode === 'navigate') return;
  
  // Only handle GET requests for images or external assets
  if (event.request.method !== 'GET') return;
  
  if (event.request.url.includes('imagekit.io')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
  }
});
