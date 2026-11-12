// Service Worker v-minerd-final-20261007-flush
const CACHE_VERSION = 'v-minerd-flush-' + Date.now();

self.addEventListener('install', (event) => {
  // Forzar activación inmediata
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          console.log('[SW] Purgando y eliminando cache viejo:', key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Red siempre directa sin almacenamiento en cache para garantizar la última versión
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
