# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 1

For the **Restaurant Reviews** project, we were asked to convert a static webpage to a mobile-ready web application, in three distinct stages.

**Stage One** focused on responsive design, accessibility and the first steps of an offline-first approach:

- [x] all page elements are visible and usable in any screen size, including desktop, tablet and mobile
- [x] images do not overlap and adjust their size and quality to the device screen
- [x] images have descriptive `alt` attributes when needed
- [x] screen reader attributes are used when appropriate
- [x] semantic HTML5 markup or - when more appropriate - aria attributes are used
- [x] data is cached using a service worker and the Cache API so that any page already visited can be accessed offline

## Working on the project

To run the project in your local computer, simply start up a simple HTTP server using Python.

In a terminal, check the version of Python you have by running `python -V`. For Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use). For Python 3.x, run  `python3 -m http.server 8000`.

> If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

### Using Grunt

This project uses Grunt to process and generate responsive images, as follows:

| Command                    | Task                                              |
| -------------------------- | ------------------------------------------------- |
| `$ grunt`                  | creates a new, completed images directory         |
| `$ grunt clean`            | removes the image directory                       |
| `$ grunt responsive_images`| re-processes images without removing the old ones |


### Note on ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write.
