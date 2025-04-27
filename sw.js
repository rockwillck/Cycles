const cacheName = 'v3.2.3';
const assetsToCache = [
  '/',
  '/index.html',
  '/privacy.html',
  '/landing.css',
  '/style.css',
  '/app.js',
  '/register.js',
  '/manifest.json',
  '/icon192.png',
  '/icon512.png',
  '/icon1174.png',
  '/mods/analyze.js',
  '/mods/matrix.js',
  '/mods/structs.js',
  '/static/Array-Regular.ttf',
  '/static/CabinetGrotesk-Variable.ttf'
];

// Install event - Pre-cache important assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      await cache.addAll(assetsToCache);
      self.skipWaiting(); // Activate SW immediately
    })()
  );
});

// Fetch event - Use network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.mode === 'navigate') {
    // Network-first strategy for navigation
    event.respondWith(
      caches.open(cacheName).then((cache) => {
        return fetch(request).then((fetchedResponse) => {
          cache.put(request, fetchedResponse.clone());
          return fetchedResponse;
        }).catch(() => cache.match(request));
      })
    );
  } else {
    // Cache-first strategy for other requests (CSS, JS, images)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((networkResponse) => {
          return caches.open(cacheName).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  }
});

// Activate event - Delete old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cn) => cn !== cacheName)
          .map((cn) => caches.delete(cn))
      )
    )
  );
});
