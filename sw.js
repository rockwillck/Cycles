const cacheName = 'v2.26';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html' ,
                '/privacy.html' ,
                '/landing.css' ,
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

self.addEventListener('fetch', (event) => {
  // Check if this is a navigation request
  if (event.request.mode === 'navigate') {
    
    // Open the cache
    event.respondWith(caches.open(cacheName).then((cache) => {
      // Go to the network first
      return fetch(event.request.url).then((fetchedResponse) => {
        cache.put(event.request, fetchedResponse.clone());

        return fetchedResponse;
      }).catch(() => {
        // If the network is unavailable, get
        return cache.match(event.request.url);
      });
    }));
  } else {
    return;
  }
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
