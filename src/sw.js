var staticCacheName = 'restaurant-reviews-v2.1';

/* When service worker installs, store key assets in cache */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll([
        '/',
        '/css/styles.css',
        '/js/main.js',
        '/js/restaurant_info.js',
        '/js/dbhelper.js',
        '/img/', // TODO: Store only unavailable image file in cache to minimize cache storage
        'https://fonts.gstatic.com/s/roboto/v18/KFOlCnqEu92Fr1MmEU9fBBc4AMP6lQ.woff2',
        'https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2'
      ]).then(() => self.skipWaiting()); // immediately activate new service workers
    })
  );
});

/* When service worker activates, check for old cache and remove */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all( // ensure completion of all promises
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('restaurant-reviews-') &&
                 cacheName != staticCacheName;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/* Check cache for resource; if not available, fetch from network and store in cache */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request).then((response) => {
        return caches.open(staticCacheName).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        })
      });
    }).catch(() => { // log error in case of failure fetching
      console.log('Currently experiencing difficulties accessing the network. Try again.');
    })
  );
});
