import { DBHelper } from './dbhelper';

const mapDOM = document.getElementById('map');
let restaurants, neighborhoods, cuisines, map, markers, mapListener;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

document.querySelector('.map__toggle').addEventListener('click', event => {
  event.preventDefault();
  if (mapDOM.style.display === 'none') {
    mapDOM.style.display = 'block';
  } else {
    mapDOM.style.display = 'none';
  }
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const SELECT = document.getElementById('filter__neighborhood');
  neighborhoods.forEach(neighborhood => {
    const OPTION = document.createElement('option');
    OPTION.innerHTML = neighborhood;
    OPTION.value = neighborhood;
    SELECT.append(OPTION);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const SELECT = document.getElementById('filter__cuisine');

  cuisines.forEach(cuisine => {
    const OPTION = document.createElement('option');
    OPTION.innerHTML = cuisine;
    OPTION.value = cuisine;
    SELECT.append(OPTION);
  });
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const C_SELECT = document.getElementById('filter__cuisine');
  const N_SELECT = document.getElementById('filter__neighborhood');

  const C_INDEX = C_SELECT.selectedIndex;
  const N_INDEX = N_SELECT.selectedIndex;

  const CUISINE = C_SELECT[C_INDEX].value;
  const NEIGHBORHOOD = N_SELECT[N_INDEX].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(CUISINE, NEIGHBORHOOD, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const UL = document.getElementById('restaurants__list');
  UL.innerHTML = '';

  // Remove all map markers
  if (self.markers === undefined) {
    self.markers = [];
  }

  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const UL = document.getElementById('restaurants__list');
  restaurants.forEach(restaurant => {
    UL.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const LI = document.createElement('li');
  LI.className = 'restaurant__item';

  const CARD = document.createElement('section');
  CARD.className = 'restaurant__card';
  CARD.setAttribute('aria-label', `${restaurant.name}`);
  CARD.setAttribute('tabindex', '0');
  LI.append(CARD);

  const PICTURE = document.createElement('picture');
  const PICTURE_URL = DBHelper.imageUrlForRestaurant(restaurant);
  PICTURE.className = 'restaurant__picture';
  PICTURE.innerHTML =
    `<source
      media=(min-width: 440px)
      srcset="${PICTURE_URL}_medium.webp"
      type="image/webp">` +
    `<source
      srcset="${PICTURE_URL}_small.webp 1x,
      ${PICTURE_URL}_small@2x.webp 2x"
      type="image/webp">` +
    `<source
      media=(min-width: 440px)
      srcset="${PICTURE_URL}_medium.jpg"
      type="image/webp">` +
    `<img
      class="restaurant__img"
      alt="The ${restaurant.name} restaurant"
      srcset="${PICTURE_URL}_small.jpg 1x,
              ${PICTURE_URL}_small@2x.jpg 2x"
      src="${PICTURE_URL}_small.jpg">`;
  CARD.append(PICTURE);

  const NAME = document.createElement('h3');
  NAME.className = 'restaurant__name';
  NAME.innerHTML = restaurant.name;
  CARD.append(NAME);

  const NEIGHBORHOOD = document.createElement('p');
  NEIGHBORHOOD.className = 'restaurant__neighborhood';
  NEIGHBORHOOD.innerHTML = restaurant.neighborhood;
  CARD.append(NEIGHBORHOOD);

  const ADDRESS = document.createElement('address');
  ADDRESS.className = 'restaurant__address';
  ADDRESS.innerHTML = restaurant.address.replace(/ *, */g, '<br>');
  CARD.append(ADDRESS);

  const MORE = document.createElement('a');
  MORE.className = 'restaurant__more';
  MORE.innerHTML = 'More details';
  MORE.href = DBHelper.urlForRestaurant(restaurant);
  MORE.setAttribute('aria-label', `View more details on ${restaurant.name}`);
  CARD.append(MORE);

  return LI;
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const MARKER = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(MARKER, 'click', () => {
      window.location.href = MARKER.url;
    });
    self.markers.push(MARKER);
  });
}

/**
 * Resolve accessibility issues relating to Google Maps JS API
 */
const improveMapAccessibility = () => {
  const INTERVAL = setInterval(() => {
    // Set title for map's <iframe>
    DBHelper.setTitleOnIframe();
    // Remove map (and its children) from tab order
    DBHelper.removeMapsTabOrder();
  }, 1000);
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(mapDOM, {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
  self.map.addListener('tilesloaded', improveMapAccessibility);
}

// Expose updateRestaurants() function to window/global scope
window.updateRestaurants = updateRestaurants;

/**
 * Register service worker for offline-first
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => {
    // success
    console.log('Service worker registered');
  }).catch((error) => {
    console.log('Service worker failed to register with ', error);
  });
}

