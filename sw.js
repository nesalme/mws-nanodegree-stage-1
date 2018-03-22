const STATIC_CACHE = 'restaurant-reviews-v4';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        'restaurant.html',
        'css/styles.css',
        'js/main.js',
        'js/restaurant_info.js',
        'js/dbhelper.js',
        'img/'
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all( // ensure completion of all promises
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('restaurant-reviews-') &&
                 cacheName != STATIC_CACHE;
        }).map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Look for assets in the cache first
    caches.match(event.request).then((response) => {
      // Return from cache if available, otherwise fetch from network
      return response || fetch(event.request);
    })
  );
});
