import { DBHelper } from './dbhelper';

const URLS = {
  // Namespace links
  xlink:            'http://www.w3.org/1999/xlink',
  // Icons
  favoriteIcon:     'images/icons/sprite.svg#icon-favorite',
  notFavoriteIcon:  'images/icons/sprite.svg#icon-not-favorite'
};

let restaurant, map;

/**
 * On page load...
 */
document.addEventListener('DOMContentLoaded', () => {
  // Listen for click events on review form submit button
  let formSubmitBtn = document.getElementById('review-submit-btn');
  formSubmitBtn.addEventListener('click', submitReview);
});

// document.addEventListener('online', DBHelper.addOfflineReviewsToDatabase);
window.addEventListener('online', DBHelper.addOfflineReviewsToDatabase);

window.addEventListener('offline', event => {
  console.log('You are now offline');
});

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
  // Fill restaurant name
  const NAME = document.getElementById('restaurant-details__name');
  NAME.innerHTML = restaurant.name;

  // Add clickable icon to (un)favorite restaurant
  // (icon within anchor element to improve user interaction - ie, increased clickable area)
  const FAV_ANCHOR = document.getElementById('restaurant__icon-anchor');
  FAV_ANCHOR.onclick = (event) => handleFavoriteClick(event, restaurant);

  const FAV_TITLE = document.getElementById('restaurant__favorite-title');
  FAV_TITLE.innerHTML = DBHelper.isFavorite(restaurant) ? 'Favorite restaurant' : 'Not favorite restaurant';

  const FAV_DESC = document.getElementById('restaurant__favorite-desc');
  FAV_DESC.innerHTML = DBHelper.isFavorite(restaurant) ? 'Click to unfavorite' : 'Click to favorite';

  const FAV_USE = document.getElementById('restaurant__favorite-use');
  FAV_USE.setAttributeNS(URLS.xlink, 'xlink:href', selectIcon(restaurant));

  // Fill responsive restaurant image
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

  // Fill restaurant cuisine
  const CUISINE = document.getElementById('restaurant-details__cuisine');
  CUISINE.innerHTML = restaurant.cuisine_type;

  // Fill restaurant address
  const ADDRESS = document.getElementById('restaurant-details__address');
  ADDRESS.innerHTML = restaurant.address.replace(/ *, */g, '<br>'); // alter address from db for UI

  // Fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // Fill reviews
  DBHelper.fetchReviews(restaurant.id, fillReviewsHTML);
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
const fillReviewsHTML = (error, reviews) => {
  self.restaurant.reviews = reviews;

  if (error) {
    console.log(`Error fetching reviews for ${restaurant.name}:`, error);
  }

  const CONTAINER = document.getElementById('reviews__container');
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
  const REVIEW_DATE = DBHelper.formatDate(review.updatedAt);

  const LI = document.createElement('li');
  LI.className = 'reviews__item';

  const ARTICLE = document.createElement('article');
  ARTICLE.className = 'review';
  ARTICLE.setAttribute('role', 'article');
  ARTICLE.setAttribute('aria-label', `Review by ${review.name} on ${REVIEW_DATE}`);
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
  DATE.innerHTML = REVIEW_DATE;
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
const fillBreadcrumb = (restaurant = self.restaurant) => {
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
  toggleFavoriteIcon(event.target);

  // Update database
  DBHelper.updateFavorite(restaurant.id, NEW_FAV_STATUS);
};

/**
  * Toggle favorite icon
  */
const toggleFavoriteIcon = (target) => {
  const ICON_NODE = document.getElementById('restaurant__favorite-use'); // ie, <use>
  const CURRENT_ICON = ICON_NODE.getAttributeNS(URLS.xlink, 'href');
  const NEW_ICON = CURRENT_ICON === URLS.favoriteIcon ? URLS.notFavoriteIcon : URLS.favoriteIcon;

  ICON_NODE.setAttributeNS(URLS.xlink, 'xlink:href', NEW_ICON);
};

/**
 * Submit new review
 */
const submitReview = () => {
  // Check validity of form: if true, continue with submission; if false, abort
  if (isFormValid() === false) {return;}

  event.preventDefault();

  console.log('Submitting review...');

  // Save input fields in review object
  const review = {
    name: document.getElementById('review-author').value,
    rating: parseInt(document.querySelector('input[name="rating"]:checked').value.charAt(0)),
    comments: document.getElementById('review-comments').value,
    restaurant_id: parseInt(getParameterByName('id')),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  if (navigator.onLine) {
    // If online, add review to database and notify user
    DBHelper.addReviewToDatabase(review);
    updateFormAlert('Your review has been successfully submitted!', 'success');
  } else {
    // If offline, add review to outbox so that it can be saved to database once back online and notify user
    DBHelper.addOfflineReviewToOutbox(review);
    updateFormAlert('You are offline. Your review has been saved and will be submitted once you are back online.', 'offline');
  }

  // Reset form after submission
  resetForm();
};

/**
 * Reset all input fields in review form
 */
const resetForm = () => {
  const form = document.getElementById('review-form');
  form.reset();
};

/**
 * Checks validity of form
 */
const isFormValid = () => {
  // If all input fields are valid, return true (to continue review submission)
  if (allInputIsValid()) {
    return true;
  }

  // Handle invalid input
  if (!nameInputIsValid() && !commentsInputIsValid()) { // Invalid name and comments input
    updateFormAlert('Please provide a valid name (3-30 characters) and a valid comment for the restaurant (5-900 characters).', 'error');
  }
  else if (!nameInputIsValid()) { // Invalid name input only
    updateFormAlert('Please provide a valid name (3-30 characters).', 'error');
  }
  else if (!commentsInputIsValid()) { // Invalid comments input only
    updateFormAlert('Please provide a valid comment (5-900 characters).', 'error');
  }

  // If any of the input fields is invalid, return false (to abort review submission)
  console.log('Review submission aborted due to invalid input field(s).');
  return false;
};

/**
 * Update alert in review form
 */
const updateFormAlert = (newValue, newClass) => {
  const formAlert = document.getElementById('form-alert');
  formAlert.innerHTML = newValue;
  formAlert.setAttribute('class', `form-alert-${newClass}`);
};

/**
 * Check validity of name input in review form
 */
function nameInputIsValid() {
  const nameInput = document.getElementById('review-author').value;
  if (nameInput.length >= 3 && nameInput.length <= 30) {return true;}
}

/**
 * Check validity of comments input in review form
 */
function commentsInputIsValid() {
  const commentsInput = document.getElementById('review-comments').value;
  if (commentsInput.length >= 5 && commentsInput.length <= 900) {return true;}
}

/**
 * Check validity of all inputs
 */
function allInputIsValid() {
  if (nameInputIsValid() && commentsInputIsValid()) {return true;}
}