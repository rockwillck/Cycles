const cacheName = 'v2.23';

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll([
                '/',
                '/index.html' ,
                '/privacy.html' ,
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

function cleanResponse(response) {
  const clonedResponse = response.clone();

  // Not all browsers support the Response.body stream, so fall back to reading
  // the entire body into memory as a blob.
  const bodyPromise = 'body' in clonedResponse ?
    Promise.resolve(clonedResponse.body) :
    clonedResponse.blob();

  return bodyPromise.then((body) => {
    // new Response() is happy when passed either a stream or a Blob.
    return new Response(body, {
      headers: clonedResponse.headers,
      status: clonedResponse.status,
      statusText: clonedResponse.statusText,
    });
  });
}

self.addEventListener('fetch', (event) => {
  // Check if this is a navigation request
  if (event.request.mode === 'navigate') {
    // Open the cache
    event.respondWith(caches.open(cacheName).then((cache) => {
      // Go to the network first
      return fetch(event.request.url, { redirect: 'follow' }).then((fetchedResponse) => {
        cache.put(event.request, cleanResponse(fetchedResponse));

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
