var staticCacheName = 'restaurant-reviews-v3';

/* When service worker installs, store key assets in cache */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll([
        '/',
        'index.html',
        'restaurant.html',
        '/styles/styles.css',
        '/scripts/main.js',
        '/scripts/restaurant_info.js',
        '/scripts/dbhelper.js',
        '/favicon.ico',
        '/apple-touch-icon.png',
        'images/unavailable_small.jpg',
        'images/unavailable_small@2x.jpg',
        'images/unavailable_medium.jpg',
        'images/unavailable_medium@2x.jpg',
        'images/unavailable_large.jpg'
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
  // Ignore non-GET requests: they cannot be cached using the Cache API
  if (event.request.method !== 'GET') {
    console.log('[Service Worker] Fetch event ignored.', event.request.method, event.request.url);
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((response) => {
        return caches.open(staticCacheName).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      });
    }).catch(() => { // log error in case of failure fetching
      console.log('Currently experiencing difficulties accessing the network. Try again.');
    })
  );
});
