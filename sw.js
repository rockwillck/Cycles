const cacheName = 'v2.10';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html' ,
                '/style.css' ,
                '/app.js' ,
                '/register.js' ,
                '/manifest.json',
                '/icon.png',
                '/icon512.png',
                '/icon1174.png',
                "/splashscreens/ss1.png",
                "/splashscreens/ss2.png",
                '/mods/analyze.js',
                '/mods/matrix.js',
                '/mods/structs.js',
                '/static/Array-Regular.ttf',
                '/static/CabinetGrotesk-Variable.ttf'
            ]);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cn) => {
          if (cn != cacheName) {
            return caches.delete(cn);
          }
        }),
      );
    }),
  );
});
