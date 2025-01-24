const cacheName = 'v2.2';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html' ,
                '/styles.css' ,
                '/app.js' ,
                '/manifest.json' ,
                '/icon.png',
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

self.addEventListener('activate', event => {
// Remove old caches
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      return keys.map(async (cache) => {
        if(cache !== cacheName) {
          console.log('Service Worker: Removing old cache: '+cache);
          return await caches.delete(cache);
        }
      })
    })()
  )
})