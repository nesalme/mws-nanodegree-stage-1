let restaurants, neighborhoods, cuisines, map, markers;

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
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
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
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
fetchCuisines = () => {
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
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const SELECT = document.getElementById('filter__cuisine');

  cuisines.forEach(cuisine => {
    const OPTION = document.createElement('option');
    OPTION.innerHTML = cuisine;
    OPTION.value = cuisine;
    SELECT.append(OPTION);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
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
resetRestaurants = (restaurants) => {
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
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const UL = document.getElementById('restaurants__list');
  restaurants.forEach(restaurant => {
    UL.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const LI = document.createElement('li');
  LI.className = 'restaurant__card';

  const PICTURE = document.createElement('picture');
  const PICTURE_URL = DBHelper.imageUrlForRestaurant(restaurant);
  PICTURE.className = 'restaurant__picture';
  PICTURE.innerHTML =
    `<source
      srcset="${PICTURE_URL}_small@1x.webp 1x,
              ${PICTURE_URL}_small@2x.webp 2x"
      type="image/webp">` +
    `<img
      class="restaurant__img"
      alt="The ${restaurant.name} restaurant"
      srcset="${PICTURE_URL}_small@1x.jpg 1x,
              ${PICTURE_URL}_small@2x.jpg 2x"
      src="${PICTURE_URL}_small@1x.jpg">`;
  LI.append(PICTURE);

  const NAME = document.createElement('h3');
  NAME.className = 'restaurant__name';
  NAME.innerHTML = restaurant.name;
  LI.append(NAME);

  const NEIGHBORHOOD = document.createElement('h4');
  NEIGHBORHOOD.className = 'restaurant__neighborhood';
  NEIGHBORHOOD.innerHTML = restaurant.neighborhood;
  LI.append(NEIGHBORHOOD);

  const ADDRESS = document.createElement('p');
  ADDRESS.className = 'restaurant__address';
  ADDRESS.innerHTML = restaurant.address.replace(/ *, */g, '<br>');
  LI.append(ADDRESS);

  const MORE = document.createElement('a');
  MORE.className = 'restaurant__more';
  MORE.innerHTML = 'View Details';
  MORE.href = DBHelper.urlForRestaurant(restaurant);
  LI.append(MORE);

  return LI;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const MARKER = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(MARKER, 'click', () => {
      window.location.href = MARKER.url;
    });
    self.markers.push(MARKER);
  });
}
