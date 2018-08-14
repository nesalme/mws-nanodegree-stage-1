const PRECACHE = 'restaurant-reviews-v1';

/* ==================================== INSTALL ==================================== */
/*              When service worker installs, store key assets in cache              */
/* --------------------------------------------------------------------------------- */
self.addEventListener('install', event => {
  console.log('Installing the service worker...');

  // Wait until static assets are stored to install service worker.
  event.waitUntil(precache().then(() => {
    // Immediately activate service worker.
    return self.skipWaiting();
  }));
});

/* =================================== ACTIVATE ==================================== */
/*           When service worker activates, check for old cache and remove           */
/* --------------------------------------------------------------------------------- */
self.addEventListener('activate', event => {
  console.log('Activating the service worker...');

  // Wait until old cache is deleted to activate service worker.
  event.waitUntil(deleteOldCache());
});

/* ===================================== FETCH ===================================== */
/* Check cache for resource; if not available, fetch from network and store in cache */
/* --------------------------------------------------------------------------------- */
self.addEventListener('fetch', event => {
  console.log('The service worker is serving the assets...');

  // Ignore non-GET requests - they cannot be cached.
  if (event.request.method !== 'GET') return;

  // For all GET requests, check cache first then fetch from network and update cache.
  event.respondWith(cacheThenNetworkAndUpdate(event.request).catch(() => {
    console.log('Currently experiencing difficulties accessing the network. Try again.');
  }));
});

/* =================================== FUNCTIONS =================================== */
/* --------------------------------------------------------------------------------- */
/**
 * Check cache first; then fetch from network and update cache.
 */
const cacheThenNetworkAndUpdate = (request) => {
  // Look for resource in cache, if it's there, serve it.
  return caches.match(request).then(response => {
    // If not, fetch from network.
    return response || fetch(request).then(response => {
      // Save new resource in cache.
      return caches.open(PRECACHE).then(cache => {
        cache.put(request, response.clone());
        return response;
      });
    });
  });
};

/**
 * Check existing cache versions and delete old versions.
 */
const deleteOldCache = () => {
  return caches.keys().then(cacheNames => {
    // Ensure completion of all promises.
    return Promise.all(
      cacheNames.filter(cacheName => {
        // Return any cache that is not the current cache.
        return cacheName.startsWith('restaurant-reviews-') && cacheName !== PRECACHE;
      }).map(cacheName => {
        // And delete each.
        return caches.delete(cacheName);
      })
    );
  });
};

/**
 * Store key static assets for offline-first.
 */
const precache = () => {
  return caches.open(PRECACHE).then(cache => {
    return cache.addAll([
      '/',
      '/index.html',
      '/restaurant.html',
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/images/unavailable_large.jpg',
      '/images/unavailable_large.webp',
      '/scripts/main.js',
      '/scripts/restaurant_info.js',
      '/scripts/dbhelper.js',
      '/styles/styles.css'
    ]);
  });
};