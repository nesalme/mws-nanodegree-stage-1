let restaurant, map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }

  const ID = getParameterByName('id');
  if (!ID) { // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(ID, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const NAME = document.getElementById('restaurant-details__name');
  NAME.innerHTML = restaurant.name;

  const ADDRESS = document.getElementById('restaurant-details__address');
  ADDRESS.innerHTML = restaurant.address.replace(/ *, */g, '<br>'); // alter address from db for UI

  const IMAGE = document.getElementById('restaurant-details__img');
  IMAGE.src = DBHelper.imageUrlForRestaurant(restaurant);

  const CUISINE = document.getElementById('restaurant-details__cuisine');
  CUISINE.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const HOURS = document.getElementById('opening-hours__table');
  for (let key in operatingHours) {
    const ROW = document.createElement('tr');
    ROW.className = 'opening-hours__row';

    const DAY = document.createElement('td');
    DAY.className = 'opening-hours__day';
    DAY.innerHTML = key;
    ROW.appendChild(DAY);

    const TIME = document.createElement('td');
    TIME.className = 'opening-hours__time';
    TIME.innerHTML = operatingHours[key].replace(/ *, */g, '<br>');
    ROW.appendChild(TIME);

    HOURS.appendChild(ROW);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const CONTAINER = document.getElementById('reviews');
  const TITLE = document.createElement('h2');
  TITLE.className = 'reviews__heading';
  TITLE.innerHTML = 'Reviews';
  CONTAINER.appendChild(TITLE);

  if (!reviews) {
    const NO_REVIEWS = document.createElement('p');
    NO_REVIEWS.innerHTML = 'No reviews yet!';
    CONTAINER.appendChild(NO_REVIEWS);
    return;
  }
  const UL = document.getElementById('reviews__list');
  reviews.forEach(review => {
    UL.appendChild(createReviewHTML(review));
  });
  CONTAINER.appendChild(UL);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const LI = document.createElement('li');
  LI.className = 'reviews__item';
  const NAME = document.createElement('p');
  NAME.className = 'review__author';
  NAME.innerHTML = review.name;
  LI.appendChild(NAME);

  const RATING = document.createElement('p');
  RATING.className = 'review__rating';
  RATING.innerHTML = `Rating: ${review.rating}`;
  LI.appendChild(RATING);

  const DATE = document.createElement('p');
  DATE.className = 'review__date';
  DATE.innerHTML = review.date;
  LI.appendChild(DATE);

  const COMMENTS = document.createElement('p');
  COMMENTS.className = 'review__comments';
  COMMENTS.innerHTML = review.comments;
  LI.appendChild(COMMENTS);

  return LI;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const BREADCRUMB = document.getElementById('breadcrumb');
  const LI = document.createElement('li');
  LI.innerHTML = restaurant.name;
  BREADCRUMB.appendChild(LI);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const REGEX = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = REGEX.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
