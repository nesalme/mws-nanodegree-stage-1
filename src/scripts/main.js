import { DBHelper } from './dbhelper';

const MAP_DOM = document.getElementById('map');

const URLS = {
  // Namespace links
  svg:              'http://www.w3.org/2000/svg',
  xlink:            'http://www.w3.org/1999/xlink',
  // Icons
  favoriteIcon:     'images/icons/sprite.svg#icon-favorite',
  notFavoriteIcon:  'images/icons/sprite.svg#icon-not-favorite'
};

let restaurants, neighborhoods, cuisines, map, markers, mapListener;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

// Check if online to update database with any items saved while offline
window.addEventListener('online', DBHelper.updateDatabase);

// Trigger console warning when offline
window.addEventListener('offline', event => console.log('You are now offline'));

/**
 * Handle click events on the entire page (minus click on favorite icon)
 */
document.addEventListener('click', event => {
  /* Handle click event on map icon */
  if (event.target.matches('.map__icon')) {
      event.preventDefault();
      toggleMap();

  /* Ignore all other click events */
  } else {
    return;
  }
}, false);

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
 * Create HTML for each restaurant.
 */
const createRestaurantHTML = (restaurant) => {
  // Add restaurant list item
  const LI = document.createElement('li');
  LI.className = 'restaurant__item';

  // Add restaurant card
  const CARD = document.createElement('section');
  CARD.className = 'restaurant__card';
  CARD.setAttribute('aria-label', `${restaurant.name}`);
  CARD.setAttribute('tabindex', '0');
  LI.append(CARD);

  // Add picture element with responsive restaurant image
  const PICTURE = document.createElement('picture');
  const PICTURE_URL = DBHelper.imageUrlForRestaurant(restaurant);
  const OVERLAY = document.createElement('div');
  OVERLAY.className = 'restaurant__picture-overlay';
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
  PICTURE.appendChild(OVERLAY);
  CARD.append(PICTURE);

  // Add clickable icon to (un)favorite restaurant
  // (icon within anchor element to improve user interaction - ie, increased clickable area)
  const FAV_ANCHOR = document.createElement('a');
  FAV_ANCHOR.className = 'restaurant__icon-anchor';

  const FAV_SVG = document.createElementNS(URLS.svg, 'svg');
  FAV_SVG.setAttributeNS(null, 'class', 'restaurant__favorite');
  FAV_SVG.setAttributeNS(null, 'aria-labelledby', `svg-title-${restaurant.id}`);
  FAV_SVG.setAttributeNS(null, 'aria-describedby', `svg-desc-${restaurant.id}`);

  const FAV_TITLE = document.createElementNS(URLS.svg, 'title');
  FAV_TITLE.setAttributeNS(null, 'id', `svg-title-${restaurant.id}`);
  FAV_TITLE.innerHTML = DBHelper.isFavorite(restaurant) ? 'Favorite restaurant' : 'Not favorite restaurant';

  const FAV_DESCRIPTION = document.createElementNS(URLS.svg, 'desc');
  FAV_DESCRIPTION.setAttributeNS(null, 'id', `svg-desc-${restaurant.id}`);
  FAV_DESCRIPTION.innerHTML = DBHelper.isFavorite(restaurant) ? 'Click to unfavorite' : 'Click to favorite';

  const FAV_USE = document.createElementNS(URLS.svg, 'use');
  FAV_USE.setAttributeNS(null, 'id', `restaurant__favorite-use-${restaurant.id}`);
  FAV_USE.setAttributeNS(URLS.xlink, 'xlink:href', selectIcon(restaurant));

  // For debugging:
  // console.log(`${restaurant.name} is favorite? -- ${restaurant.is_favorite} (${typeof restaurant.is_favorite})`);

  FAV_ANCHOR.onclick = (event) => handleFavoriteClick(event, restaurant);

  FAV_SVG.appendChild(FAV_TITLE);
  FAV_SVG.appendChild(FAV_DESCRIPTION);
  FAV_SVG.appendChild(FAV_USE);
  FAV_ANCHOR.appendChild(FAV_SVG);
  CARD.append(FAV_ANCHOR);

  // Add restaurant name
  const NAME = document.createElement('h3');
  NAME.className = 'restaurant__name';
  NAME.innerHTML = restaurant.name;
  CARD.append(NAME);

  // Add restaurant neighborhood
  const NEIGHBORHOOD = document.createElement('p');
  NEIGHBORHOOD.className = 'restaurant__neighborhood';
  NEIGHBORHOOD.innerHTML = restaurant.neighborhood;
  CARD.append(NEIGHBORHOOD);

  // Add restaurant address
  const ADDRESS = document.createElement('address');
  ADDRESS.className = 'restaurant__address';
  ADDRESS.innerHTML = restaurant.address.replace(/ *, */g, '<br>');
  CARD.append(ADDRESS);

  // Add link to restaurant details & review page
  const MORE = document.createElement('a');
  MORE.className = 'restaurant__more';
  MORE.innerHTML = 'More details';
  MORE.href = DBHelper.urlForRestaurant(restaurant);
  MORE.setAttribute('aria-label', `View more details on ${restaurant.name}`);
  CARD.append(MORE);

  return LI;
}

/**
  * Select appropriate (un)favorite icon depending on database value
  */
const selectIcon = (restaurant) => {
  if (DBHelper.isFavorite(restaurant)) {return URLS.favoriteIcon;}
  return URLS.notFavoriteIcon;
};

/**
  * Handle click on a restaurant's favorite icon
  */
const handleFavoriteClick = (event, restaurant) => {
  const CURRENT_FAV_STATUS = DBHelper.isFavorite(restaurant);
  const NEW_FAV_STATUS = !CURRENT_FAV_STATUS;

  // Change icon in the UI
  toggleFavoriteIcon(event.target, restaurant.id);

  if (navigator.onLine) {
    // When online, update database
    DBHelper.addFavoriteToDatabase(restaurant.id, NEW_FAV_STATUS);
  } else {
    // Otherwise, save favorite change to outbox to be saved in database later
    DBHelper.addFavoriteToOutbox(restaurant.id, NEW_FAV_STATUS);
  }
};

/**
  * Toggle favorite icon
  */
const toggleFavoriteIcon = (target, id) => {
  const ICON_NODE = document.getElementById(`restaurant__favorite-use-${id}`);
  const CURRENT_ICON = ICON_NODE.getAttributeNS(URLS.xlink, 'href');
  const NEW_ICON = CURRENT_ICON === URLS.favoriteIcon ? URLS.notFavoriteIcon : URLS.favoriteIcon;

  ICON_NODE.setAttributeNS(URLS.xlink, 'xlink:href', NEW_ICON);
};

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
  * Toggle map on click
  */
const toggleMap = () => {
  MAP_DOM.style.display = MAP_DOM.style.display === 'block' ? 'none' : 'block';
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(MAP_DOM, {
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

