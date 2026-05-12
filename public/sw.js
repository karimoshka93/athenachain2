const CACHE_NAME = 'athena-cache-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://ik.imagekit.io/7e0zp2ext/GLD.png?updatedAt=1772483693392'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use set to avoid duplicates and handle potential failures gracefully
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.error('Error during cache addAll:', err);
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip cross-origin requests (like Supabase/Firebase) to avoid issues
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('imagekit.io')) {
    return;
  }

  // Use Network First strategy for the root and index.html to ensure updates
  if (event.request.mode === 'navigate' || event.request.url.endsWith('index.html') || event.request.url === self.location.origin + '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          // Fallback to offline page if needed, for now just match root
          return caches.match('/');
        })
    );
    return;
  }

  // Stale-while-revalidate or Cache-first for other assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch((err) => {
        // Explicitly return a failure response instead of undefined
        console.error('Fetch failed for:', event.request.url, err);
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        // For assets, we can't do much if fetch fails and not in cache
        // but we MUST NOT return undefined.
        // Return a basic error response.
        return new Response('Network error occurred', { status: 408, statusText: 'Network Error' });
      });
    })
  );
});
