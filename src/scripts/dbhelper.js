import idb from 'idb';

/**
 * Common database helper functions.
 */
export class DBHelper {
  /* ===================================================================== */
  /*                             DATABASE URLs                             */
  /* ===================================================================== */
  /**
   * Database URL to fetch restaurants data.
   */
  static get RESTAURANTS_DB_URL() {
    const PORT = 1337; // Change this to your server port
    return `http://localhost:${PORT}/restaurants`;
  }

  /**
   * Database URL to fetch reviews data.
   */
  static get REVIEWS_DB_URL() {
    const PORT = 1337; // Change this to your server port
    return `http://localhost:${PORT}/reviews`;
  }

  /* ===================================================================== */
  /*                      GLOBAL API & INDEXEDDB CALLS                     */
  /* ===================================================================== */
  /* -------------------------------- API -------------------------------- */
  /**
   * Fetch data from API.
   */
  static fetchFromAPI(type, id = {}) {
    let url;

    if (type === 'restaurants') {
      url = DBHelper.RESTAURANTS_DB_URL;
    } else {
      url = `${DBHelper.REVIEWS_DB_URL}/?restaurant_id=${id}`;
    }

    // Fetch JSON data from API and parse.
    return fetch(url, {
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(response => response.json())
      .then(data => {
        // For debugging:
        // console.log('Updating IndexedDB with new data from API...', data);

        // Update IndexedDB database with fresh data fetched from API and return.
        DBHelper.addToIndexedDB(data, type);
        return data;
      })
      .catch(error => console.log('Request failed:', error));
  }

  /**
   * Save offline items to database.
   */
  static updateDatabase() {
    DBHelper.addOfflineFavoritesToDatabase();
    DBHelper.addOfflineReviewsToDatabase();
  }

  /* ----------------------------- IndexedDB ----------------------------- */
  /**
   * Open IndexedDB.
   */
  static openIndexedDB() {
    // For browsers with no IndexedDB support
    if (!('indexedDB' in window)) {
      console.log('This browser does not support IndexedDB.');
      return;
    }

    const DB_NAME = 'restaurant-reviews';
    const DB_VERSION = 1;

    return idb.open(DB_NAME, DB_VERSION, upgradeDB => {
      // Create object store for restaurant data (only if none exists yet)
      if (!upgradeDB.objectStoreNames.contains('restaurants')) {
        upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
      }

      // Create object store for reviews data (only if none exists yet)
      if (!upgradeDB.objectStoreNames.contains('reviews')) {
        const reviewsOS = upgradeDB.createObjectStore('reviews', {keyPath: 'id'});
        // Create restaurant id index on reviews object store
        reviewsOS.createIndex('restaurant_id', 'restaurant_id', {unique: false});
      }

      // Create object store for offline reviews (only if none exists yet)
      if (!upgradeDB.objectStoreNames.contains('offline-reviews')) {
        const offlineReviewsOS = upgradeDB.createObjectStore('offline-reviews', {
          keyPath: 'id',
          autoIncrement: true
        });
        // Create restaurant id index on offline reviews object store
        offlineReviewsOS.createIndex('restaurant_id', 'restaurant_id', {unique: false});
      }

      // Create object store for offline favorites (only if none exists yet)
      if (!upgradeDB.objectStoreNames.contains('offline-favorites')) {
        upgradeDB.createObjectStore('offline-favorites', {
          keyPath: 'restaurant_id',
          unique: true
        });
      }
    });
  }

  /**
   * Update IndexedDB cache.
   */
  static addToIndexedDB(data, objStore) {
    DBHelper.openIndexedDB()
      .then(db => {
        if (!db) return;

        const tx = db.transaction(objStore, 'readwrite');
        const store = tx.objectStore(objStore);

        // Break down imported data (if sorted in data array) and store
        // each piece of data in IndexedDB restaurants store
        if (Array.isArray(data)) {
          data.forEach(item => store.put(item));
        } else {
          store.put(data)
        }

        return tx.complete;
      })
      // For debugging:
      // .then(() => console.log(`New items successfully added to IndexedDB store: ${objStore}.`))
      .catch(error => console.log(`Failed to update IndexedDB store ${objStore}:`, error));
  }

  /**
   * Empty object store in IndexedDB.
   */
  static emptyObjectStore(objStore) {
    // console.log('Emptying object store:', objStore);

    // Open object store.
    return DBHelper.openIndexedDB()
      .then(db => {
        if (!db) return;

        const tx = db.transaction(objStore, 'readwrite');
        const store = tx.objectStore(objStore);

        store.clear();

        // console.log('Successfully deleted all items from object store:', objStore);
        return tx.complete;
      });
  }

  /**
   * Fetch data from IndexedDB.
   */
  static fetchFromIndexedDB(objStore, id = {}) {
    return DBHelper.openIndexedDB()
      .then(db => {
        if (!db) return;

        const tx = db.transaction(objStore);
        const store = tx.objectStore(objStore);

        // For reviews and offline reviews object stores, get all items by id.
        if (objStore === 'reviews' || objStore === 'offline-reviews') {
          const index = store.index('restaurant_id');
          return index.getAll(id);
        }

        // For offline favorites object store, get item by id
        if (objStore === 'offline-favorites') {
          return store.get(id);
        }

        // For restaurants and favorites, return all items in object store.
        return store.getAll();
      });
  }

  /**
  * Update existing record in IndexedDB database
  */
  static updateIndexedDB(data, objStore) {
    // console.log('Updating IndexedDB...');

    DBHelper.openIndexedDB()
      .then(db => {
        if (!db) return;

        const tx = db.transaction(objStore, 'readwrite');
        const store = tx.objectStore(objStore);

        store.put(data);

        return tx.complete;
    })
      // .then(() => console.log(`Successfully updated data in ${objStore} object store.`))
      .catch(error => console.log('Failed to update IndexedDB store:', error));
  }

  /* ===================================================================== */
  /*                              RESTAURANTS                              */
  /* ===================================================================== */
  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const CUISINES = restaurants.map((v, i) => restaurants[i].cuisine_type);
        // Remove duplicates from cuisines
        const UNIQUE_CUISINES = CUISINES.filter((v, i) => CUISINES.indexOf(v) == i);
        callback(null, UNIQUE_CUISINES);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const NEIGHBORHOODS = restaurants.map((v, i) => restaurants[i].neighborhood);
        // Remove duplicates from neighborhoods
        const UNIQUE_NEIGHBORHOODS = NEIGHBORHOODS.filter((v, i) => NEIGHBORHOODS.indexOf(v) == i);
        callback(null, UNIQUE_NEIGHBORHOODS);
      }
    });
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let fetchedFromAPI = false;

    // Fetch restaurants data from IndexedDB database.
    DBHelper.fetchFromIndexedDB('restaurants')
      .then(data => {
        // If IndexedDB returns no/empty data, fetch from API.
        if (!data || data.length < 1) {
          console.log('Retrieving restaurant data from API.');
          fetchedFromAPI = true;
          return DBHelper.fetchFromAPI('restaurants');
        }

        console.log('Retrieving restaurant data from IndexedDB database.');

        // Return data to pass into callback function.
        return data;
      })
      .then (data => {
        if (fetchedFromAPI === false) {DBHelper.fetchFromAPI('restaurants');}
        callback(null, data);
      })
      .catch(error => {
        console.log('Unable to fetch restaurant data:', error);
        callback(error, null);
      });
  }

  /**
   * Fetch restaurants by cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const RESULTS = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, RESULTS);
      }
    });
  }

  /**
   * Fetch restaurants by cuisine and neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const RESTAURANT = restaurants.find(r => r.id == id);
        if (RESTAURANT) { // Got the restaurant
          callback(null, RESTAURANT);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const RESULTS = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, RESULTS);
      }
    });
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    // Use restaurant data to retrieve correct photograph from images folder
    if (restaurant && restaurant.photograph) {
      return `/images/${restaurant.photograph}`;
    }
    // Retrieve custom image if restaurant does not have photo.
    // Custom image uses an original photograph of Alex Jones, available on Unsplash at:
    // https://unsplash.com/photos/v0_6jaOOjpk
    // TODO: Give credit to photographer and Unsplash in UI (eg, Photo by Alex Jones on Unsplash)
    return `/images/unavailable`;
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /* ===================================================================== */
  /*                               FAVORITES                               */
  /* ===================================================================== */
  /**
   * Add offline favorite statuses to database.
   */
  static addOfflineFavoritesToDatabase() {
    console.log('Adding offline favorite updates to database...');

    // Open offline favorites object store.
    return DBHelper.openIndexedDB()
      .then(db => {
        if (!db) return;

        const tx = db.transaction('offline-favorites');
        const store = tx.objectStore('offline-favorites');

        let isEmpty;

        return store.getAll()
          .then(allItems => {
            if (!allItems || allItems.length < 1) {
              isEmpty = true;
              // console.log('No offline favorites in cache.');
              return;
            }

            allItems.forEach(item => {
              DBHelper.updateFavoriteInDatabase(item.restaurant_id, item.is_favorite);
            });
          })
          .then(() => {
            if (!isEmpty) {
              DBHelper.emptyObjectStore('offline-favorites');
            }
          });
      })
  }

  /**
   * Check if restaurant has been (un)marked favorite offline
   */
  static hasOfflineFavorite(restaurant) {
    // For debugging:
    // console.log('Checking if restaurant has been (un)marked favorite offline...');

    return DBHelper.fetchFromIndexedDB('offline-favorites', restaurant.id)
      .then(result => {
        if (!result || result.length < 1) {
          // console.log('Result of fetching offline favorite from IDB:', result);
          return false;
        } else {
          // console.log('Result of fetching offline favorite from IDB:', result);
          return true;
        }
      });
  }

  /**
   * Check if restaurant is favorite to return appropriate icon
   */
  static isFavorite(restaurant) {
    if (restaurant.is_favorite === false || restaurant.is_favorite === 'false' || !restaurant.is_favorite) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * Check if restaurant is favorite, when it has an offline favorite status
   */
  static isOfflineFavorite(restaurant) {
    // For debugging:
    // console.log('Checking offline favorite status for restaurant...');

    return DBHelper.fetchFromIndexedDB('offline-favorites', restaurant.id)
      .then(data => {;
        if (!data.is_favorite) {
          return false;
        } else {
          return true;
        }
      });
  }

  /**
   * Add updated favorite status to IndexedDB to save to database later.
   */
  static saveOfflineFavorite(id, newStatus) {
    console.log('Saving updated favorite status offline...');

    // Open offline favorites object store in IndexedDB
    DBHelper.openIndexedDB()
      .then(db => {
        if (!db) return;

        const tx = db.transaction('offline-favorites', 'readwrite');
        const store = tx.objectStore('offline-favorites');

        // Store updated favorite status
        store.put({
          restaurant_id: id,
          is_favorite: newStatus
        });

        return tx.complete;
      })
      .then(() => {
        console.log('Updated favorite status successfully saved offline.')
      })
      .catch(error => {
        console.log('Failed to save updated favorite status offline:', error)
      });
  }

  /**
   * Update favorite information
   */
  static updateFavoriteInDatabase(id, newStatus) {
    // For debugging:
    console.log('Updating favorite information...');
    // console.log(typeof newStatus);

    // Variables for fetch request
    const url = `${DBHelper.RESTAURANTS_DB_URL}/${id}/?is_favorite=${newStatus}`;
    const options = {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({is_favorite: newStatus})
    };

    // For debugging
    // console.log(JSON.stringify({is_favorite: newStatus}));

    fetch(url, options)
      .then(response => {
        return response.json();
      })
      .then(data => {
        // console.log('Updating IndexedDB:', data);
        DBHelper.updateIndexedDB(data, 'restaurants');
      })
      .catch(error => console.warn('[ERROR]:', error));
  }

  /* ===================================================================== */
  /*                                REVIEWS                                */
  /* ===================================================================== */
  /**
   * Add offline reviews to database.
   */
  static addOfflineReviewsToDatabase() {
    console.log('Adding offline reviews to database...');

    // Open offline reviews store
    return DBHelper.openIndexedDB()
      .then(db => {
        if (!db) return;

        const tx = db.transaction('offline-reviews');
        const store = tx.objectStore('offline-reviews');

        let isEmpty;

        return store.getAll()
          .then(allItems => {
            if (!allItems || allItems.length < 1) {
              isEmpty = true;
              console.log('No offline reviews in cache.');
              return;
            }

            allItems.forEach(item => {
              DBHelper.addReviewToDatabase(item.data);
            });
          })
          .then(() => {
            if (!isEmpty) {
              DBHelper.emptyObjectStore('offline-reviews');
            }
          });
      });
  }

  /**
   * Add new restaurant review.
   */
  static addReviewToDatabase(input) {
    // For debugging only:
    // console.log('Input:', input);
    console.log('Adding review to database...');

    // Create review object with data from new review form.
    const review = {
      restaurant_id: input.restaurant_id,
      name: input.name,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      rating: input.rating,
      comments: input.comments
    };

    // For debugging only
    // console.log('Review:', review);

    // Variables for fetch request
    const url = DBHelper.REVIEWS_DB_URL;
    const options = {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(review)
    };

    // Fetch request to POST new review to database
    fetch(url, options)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`Fetch to post request rejected with status: ${response.status}`);
        }
      })
      .then(result => {
        // console.log('Success:', result);

        // Add newly added review to the reviews IDB store
        DBHelper.addToIndexedDB(result, 'reviews');
      })
      .catch(error => console.error('Error:', error));
  }

  /**
 * Fetch all offline reviews by restaurant id (when applicable)
 */
  static fetchOfflineReviews(id, callback) {
    DBHelper.fetchFromIndexedDB('offline-reviews', id)
      .then(reviews => {
        // If IndexedDB returns no/empty reviews, abort
        if (!reviews || reviews.length < 1) {
          // console.log('No offline reviews in cache to display.');
          return;
        }

        // console.log('Retrieving offline reviews data from IndexedDB database...');

        return reviews;
      })
      .then(reviews => {
        callback(null, reviews);
      })
      .catch(error => {
        console.log('Unable to fetch offline reviews data:', error);
        callback(error, null);
      });
  }

  /**
   * Fetch all reviews by restaurant id
   */
  static fetchReviews(id, callback) {
    let fetchedFromAPI = false;

    DBHelper.fetchFromIndexedDB('reviews', id)
      .then(data => {
        // If IndexedDB returns no/empty data, fetch from API.
        if (!data || data.length < 1) {
          console.log('Retrieving reviews data from API...');
          fetchedFromAPI = true;
          return DBHelper.fetchFromAPI('reviews', id);
        }

        console.log('Retrieving reviews data from IndexedDB database...');

        // Return data to pass into callback function.
        return data;
      })
      .then(data => {
        if (fetchedFromAPI === false) {
          console.log('Calling to API to update reviews cache...');
          DBHelper.fetchFromAPI('reviews', id);
        }
        callback(null, data);
      })
      .catch(error => {
        console.log('Unable to fetch reviews data:', error);
        callback(error, null);
      });
  }

  /**
   * Save offline review to IndexedDB.
   */
  static saveOfflineReview(review) {
    console.log('Saving offline review...');

    // Open offline reviews object store
    DBHelper.openIndexedDB()
      .then(db => {
        if (!db) return;

        const tx = db.transaction('offline-reviews', 'readwrite');
        const store = tx.objectStore('offline-reviews');

        // Store offline review
        store.put({
          restaurant_id: review.restaurant_id,
          data: review
        });

        return tx.complete;
      })
      .then(() => console.log('New review successfully saved offline.'))
      .catch(error => console.log('Failed to save review in IndexedDB:', error));
  }

  /* ===================================================================== */
  /*                                  MAPS                                 */
  /* ===================================================================== */
  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const MARKER = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return MARKER;
  }

  /**
   * Set title on iframe to fulfill accessibility requirements
   */
  static setTitleOnIframe() {
    document.querySelectorAll('#map iframe').forEach((el) => {
      el.setAttribute('title', 'Restaurant locations on Google Maps');
    });
  }

  /**
 * Remove map (and all descendants) from tab order
 */
  static removeMapsTabOrder() {
    document.querySelectorAll('#map *').forEach((el) => {
      el.setAttribute('tabindex', '-1');
    });
  }

  /* ===================================================================== */
  /*                             OTHERS HELPERS                            */
  /* ===================================================================== */
  /**
   * Format date as Month DD, YYYY
   */
  static formatDate(input) {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return new Date(input).toLocaleDateString('en-US', options);
  }
}