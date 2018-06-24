# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

## Project Overview: Stage 2

For the **Restaurant Reviews** project, we were asked to convert a static webpage to a mobile-ready web application, in three distinct stages.

**Stage One** focuses on responsive design, accessibility and the first steps of an offline-first approach:

- [x] all page elements are visible and usable in any screen size, including desktop, tablet and mobile
- [x] images do not overlap and adjust their size and quality to the device screen
- [x] images have descriptive `alt` attributes when needed
- [x] screen reader attributes are used when appropriate
- [x] semantic HTML5 markup or - when more appropriate - aria attributes are used
- [x] data is cached using a service worker and the Cache API so that any page already visited can be accessed offline

**Stage Two** makes use of the Fetch API to fetch data from an API (see below for details on this) and further builds on the project's offline-first capabilities, implementing more robust caching using the IndexedDB API, while applying performance, PWA, responsiveness and accessibility best practices:

- [x] the application fetches JSON restaurant data from a development server using the Fetch API, which it then parses to render in the UI
- [ ] JSON responses are cached using the IndexedDB API, as part of our offline-first strategy
- [ ] Lighthouse reports scores of 70+ in Performance and 90+ in Progressive Web Apps and Accessibility

## Working on the project

Because Stage 2 uses a development server (instead of simply sourcing restaurant data locally), we will need to run two separate servers in parallel.

### Connect to the development server

Fork and clone the [development server repository](https://github.com/udacity/mws-restaurant-stage-2) and follow the instructions on the repository to set it up on your local machine.

Once it's been installed, simply run `node server` in the command line to spin up the development server (by default, on port 1337).

### Start up a Python server

Once the development server is running, we start up a simple HTTP server for the project using Python.

In a terminal, check the version of Python you have by running `python -V`. For Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use). For Python 3.x, run  `python3 -m http.server 8000`.

> If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

## Using Grunt

This project uses Grunt to process and generate responsive images, as follows:

| Command                    | Task                                              |
| -------------------------- | ------------------------------------------------- |
| `$ grunt`                  | creates a new, completed images directory         |
| `$ grunt clean`            | removes the image directory                       |
| `$ grunt responsive_images`| re-processes images without removing the old ones |


## Note on ES6

Most of the code in this project has been written to the ES6 JavaScript specification for compatibility with modern web browsers and future proofing JavaScript code. As much as possible, try to maintain use of ES6 in any additional JavaScript you write.
