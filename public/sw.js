// Completely disable background fetching to prevent ERR_FAILED during domain migration
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

// Do not intercept any requests for now to ensure site loads correctly
self.addEventListener('fetch', (event) => {
  // Let everything pass through to the network
  return;
});
