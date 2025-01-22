self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('v1').then(cache => {
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
                '/static/Kola-Regular.ttf'
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