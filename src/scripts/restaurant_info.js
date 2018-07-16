import { DBHelper } from './dbhelper';

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
      self.map.addListener('tilesloaded', improveMapAccessibility);
    }
  });
}

document.addEventListener('click', event => {
  // Handle click event on favorite icon
  if (event.target.matches('.restaurant__icon-anchor')) {
    event.preventDefault();

    const XLINK_NS = 'http://www.w3.org/1999/xlink';
    const ICONS_LINK = 'images/icons/sprite.svg#icon-';
    const ICON = document.getElementById('restaurant__favorite').firstChild; // ie, <use>
    const ICON_XLINK = ICON.getAttributeNS(XLINK_NS, 'href');

    // Switch between not-favorite and favorite icons
    ICON.setAttributeNS(XLINK_NS, 'xlink:href', `${ICONS_LINK}${ICON_XLINK.includes('#icon-not-favorite') ? 'favorite' : 'not-favorite'}`);
  }
});

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
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
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const NAME = document.getElementById('restaurant-details__name');
  NAME.innerHTML = restaurant.name;

  /* const FAVORITE = document.getElementById('restaurant__favorite');
  const FAVORITE_USE = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  FAVORITE_USE.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'images/icons/sprite.svg#icon-not-favorite');
  FAVORITE.appendChild(FAVORITE_USE); */

  const FAVORITE_BOX = document.getElementById('restaurant__icon-anchor');
  const FAVORITE_SVG = document.getElementById('restaurant__favorite');
  const FAVORITE_USE = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  FAVORITE_USE.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `images/icons/sprite.svg#icon-${DBHelper.isFavorite(restaurant) ? 'favorite' : 'not-favorite'}`);
  FAVORITE_SVG.appendChild(FAVORITE_USE);

  const ADDRESS = document.getElementById('restaurant-details__address');
  ADDRESS.innerHTML = restaurant.address.replace(/ *, */g, '<br>'); // alter address from db for UI

  const PICTURE = document.getElementById('restaurant-details__picture');
  const PICTURE_URL = DBHelper.imageUrlForRestaurant(restaurant);
  PICTURE.innerHTML =
    `<source
      media="(min-width: 1200px)"
      srcset="${PICTURE_URL}_large.webp"
      sizes="45vw"
      type="image/webp">` +
    `<source
      media="(min-width: 440px)"
      srcset="${PICTURE_URL}_medium.webp"
      sizes="(min-width: 650px) 50vw, 85vw"
      type="image/webp">` +
    `<source
      srcset="${PICTURE_URL}_small.webp 1x,
              ${PICTURE_URL}_small@2x.webp 2x"
      type="image/webp">` +
    `<source
      media="(min-width: 1280px)"
      srcset="${PICTURE_URL}_large.jpg"
      sizes="45vw">` +
    `<source
      media="(min-width: 440px)"
      srcset="${PICTURE_URL}_medium.jpg"
      sizes="(min-width: 650px) 50vw, 85vw">` +
    `<img
      class="restaurant-details__img"
      id="restaurant-details__img"
      alt="The ${restaurant.name} restaurant"
      srcset="${PICTURE_URL}_small.jpg 1x,
              ${PICTURE_URL}_small@2x.jpg 2x"
      src="${PICTURE_URL}_small.jpg">`;

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
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const HOURS = document.getElementById('opening-hours__table');
  for (let key in operatingHours) {
    const ROW = document.createElement('tr');
    ROW.className = 'opening-hours__row';

    const DAY = document.createElement('th');
    DAY.className = 'opening-hours__day';
    DAY.setAttribute('scope','row');
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
const fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const CONTAINER = document.getElementById('reviews');
  const TITLE = document.createElement('h3');
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
const createReviewHTML = (review) => {
  const LI = document.createElement('li');
  LI.className = 'reviews__item';

  const ARTICLE = document.createElement('article');
  ARTICLE.className = 'review';
  ARTICLE.setAttribute('role', 'article');
  ARTICLE.setAttribute('aria-label', `Review by ${review.name} on ${review.date}`);
  LI.appendChild(ARTICLE);

  const NAME = document.createElement('p');
  NAME.className = 'review__author';
  NAME.innerHTML = review.name;
  NAME.setAttribute('aria-hidden', 'true');
  ARTICLE.appendChild(NAME);

  const RATING = document.createElement('p');
  RATING.className = 'review__rating';
  RATING.innerHTML = `Rating: ${review.rating}`;
  ARTICLE.appendChild(RATING);

  const DATE = document.createElement('p');
  DATE.className = 'review__date';
  DATE.innerHTML = review.date;
  DATE.setAttribute('aria-hidden', 'true');
  ARTICLE.appendChild(DATE);

  const COMMENTS = document.createElement('p');
  COMMENTS.className = 'review__comments';
  COMMENTS.innerHTML = review.comments;
  ARTICLE.appendChild(COMMENTS);

  return LI;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant=self.restaurant) => {
  const BREADCRUMB = document.getElementById('breadcrumb');
  const LI = document.createElement('li');
  LI.innerHTML = restaurant.name;
  LI.setAttribute('aria-current', 'page');
  BREADCRUMB.appendChild(LI);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
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
