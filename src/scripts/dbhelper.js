import idb from 'idb';

/**
 * Common database helper functions.
 */
export class DBHelper {
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
      console.log('Creating a new object store');

      // Create object store for restaurant data (only if none exists yet)
      if (!upgradeDB.objectStoreNames.contains('restaurants')) {
        console.log('Creating new object store: restaurants');
        upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
      }

      // Create object store for reviews data (only if none exists yet)
      if (!upgradeDB.objectStoreNames.contains('reviews')) {
        console.log('Creating new object store: reviews');
        const reviewsOS = upgradeDB.createObjectStore('reviews', {keyPath: 'id'});
        reviewsOS.createIndex('restaurant_id', 'restaurant_id', {unique: false});
      }
    });
  }

  /**
   * Update IndexedDB cache.
   */
  static addToIndexedDB(data, objStore) {
    DBHelper.openIndexedDB()
      .then(db => {
        const tx = db.transaction(objStore, 'readwrite');
        const store = tx.objectStore(objStore);

        // Break down imported data (sorted in data array) and store
        // each piece of data in IndexedDB restaurants store
        data.forEach(item => store.put(item));

        return tx.complete;
      })
      .then(() => console.log('IndexedDB database successfully updated.'))
      .catch(error => console.log('Failed to update IndexedDB store:', error));
  }

  /**
   * Fetch data from IndexedDB database.
   */
  static fetchFromIndexedDB(objStore, id = {}) {
    return DBHelper.openIndexedDB()
      .then(db => {
        const tx = db.transaction(objStore);
        const store = tx.objectStore(objStore);

        // If restaurant ID is provided, fetch all from index
        if (objStore === 'reviews') {
          const index = store.index('restaurant_id');
          return index.getAll();
        }

        // Return all items in object store.
        return store.getAll();
      });
  }

  /**
   * Fetch data from API.
   */
  static fetchFromAPI(objStore, id = {}) {
    let url;

    if (objStore === 'restaurants') {
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
        // Update IndexedDB database with fresh data fetched from API and return.
        DBHelper.addToIndexedDB(data, objStore);
        return data;
      })
      .catch(error => console.log('Request failed:', error));
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const objStore = 'restaurants';

    // Fetch restaurants data from IndexedDB database.
    DBHelper.fetchFromIndexedDB(objStore)
      .then(data => {
        // If IndexedDB returns no/empty data, fetch from API.
        if (!data || data.length < 1) {
          console.log('Retrieving restaurant data from API.');
          return DBHelper.fetchFromAPI(objStore);
        }

        console.log('Retrieving restaurant data from IndexedDB database.');

        // Return data to pass into callback function.
        return data;
      })
      .then (data => {
        callback(null, data);
      })
      .catch(error => {
        console.log('Unable to fetch restaurant data:', error);
        callback(error, null);
      });
  }

  static fetchReviews(id, callback) {
    DBHelper.fetchFromIndexedDB('reviews', id)
      .then(data => {
        // If IndexedDB returns no/empty data, fetch from API.
        if (!data || data.length < 1) {
          console.log('Retrieving reviews data from API.');
          return DBHelper.fetchFromAPI('reviews', id);
        }

        console.log('Retrieving reviews data from IndexedDB database.');

        // Return data to pass into callback function.
        return data;
      })
      .then(data => {
        callback(null, data);
      })
      .catch(error => {
        console.log('Unable to fetch reviews data:', error);
        callback(error, null);
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
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
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
 * Remove map (and all descendants) from tab order
 */
  static removeMapsTabOrder() {
    document.querySelectorAll('#map *').forEach((el) => {
      el.setAttribute('tabindex', '-1');
    });
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
   * Check if restaurant is favorite to return appropriate icon
   */
  static isFavorite(restaurant) {
    if (restaurant.is_favorite === false || restaurant.is_favorite === 'false') {
      return false;
    } else {
      return true;
    }
  }

  /**
    * Update favorite information
    */
  static updateFavorite(restaurantID, newFavoriteStatus) {
    // For debugging
    console.log('Updating favorite information');
    // console.log(typeof newFavoriteStatus);

    // Variables for fetch request
    const url = `${DBHelper.RESTAURANTS_DB_URL}/${restaurantID}/?is_favorite=${newFavoriteStatus}`;
    const options = {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({is_favorite: newFavoriteStatus})
    };

    // For debugging
    // console.log(JSON.stringify({is_favorite: newFavoriteStatus}));

    fetch(url, options)
      .then(response => {return response.json();})
      .then(data => DBHelper.updateIndexedDB(data))
      .catch(error => console.warn('[ERROR]:', error));
  }

  /**
    * Update existing record in IndexedDB database
    */
  static updateIndexedDB(data) {
    console.log('Updating IndexedDB...');

    DBHelper.openIndexedDB()
      .then(db => {
        const tx = db.transaction('restaurants', 'readwrite');
        const store = tx.objectStore('restaurants');

        store.put(data);

        return tx.complete;
    })
      .then(() => console.log('IndexedDB database successfully updated.'))
      .catch(error => console.log('Failed to update IndexedDB store:', error));
  }

  static formatDate(input) {
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    return new Date(input).toLocaleDateString('en-US', options);
  }

  static addReview(input) {
    // For debugging only:
    // console.log('Input:', input);
    console.log('Adding review to database...');

    const review = {
      restaurant_id: input.restaurant_id,
      name: input.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rating: input.rating,
      comments: input.comments
    };

    // For debugging only:
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

    fetch(url, options)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`Fetch to post request rejected with status: ${response.status}`);
        }
      })
      .then(result => console.log('Success:', result))
      .catch(error => console.error('Error:', error));
  }
}