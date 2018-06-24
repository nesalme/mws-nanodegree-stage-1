/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const PORT = 1337; // Change this to your server port
    return `http://localhost:${PORT}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // Pull JSON response from API and parse.
    return fetch(DBHelper.DATABASE_URL, {
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    }).then(response => response.json())
      .then(data => callback(null, data))
      .catch(error => console.log('Request failed:', error));
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
      return `/img/${restaurant.photograph}`;
    }
    // Retrieve custom image if restaurant does not have photo.
    // Custom image uses an original photograph of Alex Jones, available on Unsplash at:
    // https://unsplash.com/photos/v0_6jaOOjpk
    // TODO: Give credit to photographer and Unsplash in UI (eg, Photo by Alex Jones on Unsplash)
    return `/img/unavailable`;
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
}
