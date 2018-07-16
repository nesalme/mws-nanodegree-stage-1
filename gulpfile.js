// *****************************************************************
//
//  GULPFILE
//
// *****************************************************************
//
// Available tasks:
// ----------------
//  -> MAIN TASKS
//  $ gulp                    : Default task, builds and starts development server
//  $ gulp build              : Run all build tasks in sequence from scratch
//  $ gulp clean              : Clean all files and folders generated in build tasks
//  $ gulp serve              : Start BrowserSync server for development and watch files
//                              for changes
//
//  -> SUPPORTING TASKS
//  $ gulp clean:dist         : Clean dist directory
//  $ gulp clean:images       : Clean all images from dist and .tmp directories
//  $ gulp clean:tmp          : Clean .tmp directory
//  $ gulp html               : Build any new/changed HTML files in dist directory (with injected Favicon markup)
//  $ gulp images             : Optimize and build images (all formats)
//  $ gulp build:pwa          : Build app icons and web manifest
//  $ gulp responsive-images  : Optimize and build responsive images (JPEG,PNG,WebP)
//  $ gulp scripts            : Bundle, minify and build JavaScript
//  $ gulp styles             : Optimize and build CSS files
//  $ gulp watch:scripts      : Ensure that server reload happens at end of all JS tasks
//
//  -> CURRENTLY DISABLED, AIMING FOR FUTURE IMPROVEMENT:
//  $ gulp clean:favicon      : Clean Favicon data file
//  $ gulp generate:favicon   : Generate Favicons using RealFaviconGenerator
//  $ gulp update:favicon     : Check RealFaviconGenerator for updates
//
// -----------------------------------------------------------------
//  Modules
// -----------------------------------------------------------------
//
//  autoprefixer        : Prefix CSS
//  babelify            : Transpile JavaScript with Babel and Browserify
//  browser-sync        : Use a synchronized server for development
//  browserify          : Bundle modules and dependencies in JavaScript files
//  css-mqpacker        : Pack same CSS media queries into one using PostCSS
//  cssnano             : Minify CSS using PostCSS
//  del                 : Delete files and folders
//  gulp                : The streaming build system
//  gulp-changed        : Only pass through changed files
//  gulp-imagemin       : Minify PNG, JPEG, GIF and SVG images
//  gulp-load-plugins   : Automatically load Gulp plugins
//  gulp-newer          : Only pass through newer source files
//  gulp-notify         : Emit notifications
//  gulp-postcss        : Process and parse CSS at once through several plugins
//  gulp-real-favicon   : Generate multiplatform favicons with RealFaviconGenerator
//  gulp-rename         : Rename files
//  gulp-responsive     : Generate responsive images
//  gulp-sass           : Compile Sass into CSS
//  gulp-sourcemaps     : Generate sourcemaps for minified code
//  gulp-tap            : Tap into a pipeline with Gulp
//  gulp-uglify         : Minify JavaScript with UglifyJS
//  gulplog             : Logger
//  postcss-assets      : Manage assets using PostCSS
//  run-sequence        : Run series of Gulp tasks in order
//  vinyl-buffer        : Convert streaming vinyl files to use buffers
//  vinyl-source-stream : Use conventional text streams at start of Gulp/Vinyl pipelines
//  watchify            : Watch mode for Browserify builds
//
// Note: Gulpfile structure inspired by Drew Barontini's May 2015
// post on 'Building a Better Gulpfile'
// (https://drewbarontini.com/articles/building-a-better-gulpfile/).

// Basic setup: Gulp and gulp-load-plugins
const gulp = require('gulp');
const $ = require('gulp-load-plugins')({
  camelize: true,
  lazy: true,
  pattern: [
    'gulp-*', 'gulp.*', '@*/gulp{-,.)*',
    'del', 'run-sequence'
  ]
});

// BrowserSync
const browserSync = require('browser-sync').create();

// Browserify and related plugins
// (to circumvent issues with loading these using gulp-load-plugins)
const babelify = require('babelify');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const log = require('gulplog');

// Plugins required by PostCSS (gulp-postcss)
// (to circumvent issues with loading these using gulp-load-plugins)
const assets = require('postcss-assets');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const mqpacker = require('css-mqpacker');

// Favicons
/* const realFavicon = require('gulp-real-favicon');
const fs = require('fs');
const FAVICON_DATA_FILE = 'faviconData.json'; */

// -----------------------------------------------------------------
//  Configuration objects for file/folder paths
// -----------------------------------------------------------------
const PATHS = {
  // Folder paths within DIST directory
  DIST: 'dist',
  DIST_CSS: 'dist/styles',
  DIST_IMG: 'dist/images',
  DIST_JS: 'dist/scripts',

  // File paths (including globs) within SRC directory
  SRC_CSS: 'src/styles/**/*.css',
  SRC_HTML: 'src/**/*.html',
  SRC_IMG: 'src/images/**/*',
  SRC_JS: 'src/**/*.js',
  SRC_PWA: 'src/*.+(png|ico|svg|webmanifest)',

  // Folder paths within .TMP directory
  TMP: '.tmp',
  TMP_IMG: '.tmp/images'
};

// -----------------------------------------------------------------
//  Tasks: Default (build and start development server)
// -----------------------------------------------------------------
gulp.task('default', (callback) => {
  $.runSequence(
    'build',
    'serve',
    callback
  )
});

// -----------------------------------------------------------------
//  Tasks: Start BrowserSync server for development and watch files
//         for changes
// -----------------------------------------------------------------
gulp.task('serve', () => {
  browserSync.init({
    server: {baseDir: 'dist'},
    port: 8000,
    browser: 'google chrome canary' // Comment out or change browser, as needed
  });

  // Watch files for changes and reload
  gulp.watch(PATHS.SRC_CSS, ['styles']);
  gulp.watch(PATHS.SRC_JS, ['watch:scripts']);
  // gulp.watch(PATHS.SRC_HTML).on('change', browserSync.reload);
  gulp.watch(PATHS.SRC_HTML, ['html']);
  gulp.watch(PATHS.SRC_IMG).on('change', browserSync.reload);
  gulp.watch(PATHS.SRC_PWA).on('change', browserSync.reload);
});

// Watch JavaScript files to ensure that reload happens at the end of JS tasks
// (inspired by recipe on https://browsersync.io/docs/gulp)
gulp.task('watch:scripts', ['scripts'], (done) => {
  browserSync.reload();
  done();
});

// -----------------------------------------------------------------
//  Tasks: Run all build tasks in sequence
// -----------------------------------------------------------------
gulp.task('build', (callback) => {
  $.runSequence(
    'clean',
    ['html', 'styles', 'scripts', 'build:pwa'],
    // 'update:favicon',
    callback
  )
});

// Build Progressive Web Application files (icons and web manifest)
gulp.task('build:pwa', () => {
  return gulp.src(PATHS.SRC_PWA)
    .pipe(gulp.dest(PATHS.DIST))
    .pipe($.notify({
      message: 'Building PWA files... complete!',
      onLast: true
    }));
});

// -----------------------------------------------------------------
//  Tasks: Clean
// -----------------------------------------------------------------
gulp.task('clean', ['clean:dist', 'clean:tmp'/* , 'clean:favicon' */]);

// Clean up DIST directory
gulp.task('clean:dist', () => {
  if (PATHS.DIST) {
    return $.del.sync(PATHS.DIST);
  }
});

// Clean up .TMP directories
gulp.task('clean:tmp', () => {
  if (PATHS.TMP) {
    return $.del.sync(PATHS.TMP);
  }
});

// Clean up images folder from DIST and TMP directories
gulp.task('clean:images', () => {
  return $.del.sync([PATHS.DIST_IMG, PATHS.TMP_IMG]);
});

// Clean up Favicon data file
// gulp.task('clean:favicon', () => {
//   return $.del.sync(FAVICON_DATA_FILE);
// })

// -----------------------------------------------------------------
//  Tasks: Build HTML files
// -----------------------------------------------------------------
gulp.task('html', ['styles'/* , 'generate:favicon' */], () => {
  return gulp.src(PATHS.SRC_HTML)
    .pipe($.newer(PATHS.DIST))
    // Inject Favicon markup in HTML files
    // .pipe(realFavicon.injectFaviconMarkups(JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code))
    .pipe(gulp.dest(PATHS.DIST))
    .pipe($.notify({
      message: 'Building HTML... complete!',
      onLast: true
  }));
});

// -----------------------------------------------------------------
//  Task: JavaScript optimization and build
//        (using Browserify, Babelify and Uglify)
// -----------------------------------------------------------------
gulp.task('scripts', () => {
  return gulp.src(PATHS.SRC_JS, {read: false})
    .pipe($.tap((file) => {
      log.info('Bundling ' + file.path);
      file.contents = browserify(file.path, {debug: true})
        .transform('babelify', {
          presets: [
            ['env', {
              'targets': {
                'browsers': ['last 2 versions', 'safari >= 7']
              }
            }]
          ],
          sourceMapsAbsolute: true
        })
        .bundle();
    }))
    .pipe(buffer())
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.uglify()).on('error', log.error)
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(PATHS.DIST))
    .pipe($.notify({
      message: 'Building scripts... Complete!',
      onLast: true
  }));
});

// -----------------------------------------------------------------
//  Tasks: CSS optimization and build (using PostCSS)
// -----------------------------------------------------------------
gulp.task('styles', ['images'], () => {
  // PostCSS processors
  const processors = [
    assets({loadPaths: ['**']}),
    autoprefixer({browsers: ['last 2 versions']}),
    mqpacker,
    cssnano
  ];

  return gulp.src(PATHS.SRC_CSS)
    .pipe($.sourcemaps.init())
    // .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe($.postcss(processors))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest(PATHS.DIST_CSS))
    .pipe(browserSync.stream())
    .pipe($.notify({
      message: 'Building styles... complete!',
      onLast: true
  }));
});

// -----------------------------------------------------------------
//  Tasks: Images optimization and build (using Imagemin)
// -----------------------------------------------------------------
// Optimise and build images
gulp.task('images', ['responsive-images'], () => {
  return gulp.src(PATHS.SRC_IMG + '.+(gif|svg)')
    .pipe($.changed(PATHS.TMP_IMG))
    .pipe(gulp.dest(PATHS.TMP_IMG))
    .pipe($.imagemin({
      interlaced: true,       // Use progressive rendering to compress GIFs
      svgoPlugins: [{
        removeViewBox: true,  // Remove viewBox attribute from SVGs
        cleanupIDs: false     // Do not minify/remove unused IDs
      }]
    }))
    .pipe(gulp.dest(PATHS.DIST_IMG))
    .pipe($.notify({
      message: 'Building GIF and SVG images... complete!',
      onLast: true
  }));
});

// Optimise and build JPEG, PNG and WebP files
gulp.task('responsive-images', () => {
  return gulp.src(PATHS.SRC_IMG + '.+(jpg|png|webp)')
    .pipe($.changed(PATHS.TMP_IMG))
    .pipe(gulp.dest(PATHS.TMP_IMG))
    .pipe($.responsive({
      // JPEG/PNG files are generated in original format and in WebP
      '!*.webp': [
        // In original format
        {
          width: 200, // image_small is 200px wide
          rename: {suffix: '_small'}
        },
        {
          width: 200 * 2, // image_small@2x is 400px wide
          rename: {suffix: '_small@2x'}
        },
        {
          width: 512, // image_medium is 512px wide
          rename: {suffix: '_medium'}
        },
        {
          width: 512 * 2, // image_medium@2x is 1024px wide
          rename: {suffix: '_medium@2x'}
        },
        {
          width: 800, // image_large is 800px wide
          rename: {suffix: '_large'}
        },
        // Converted to WebP
        {
          width: 200, // image_small is 200px wide
          rename: {
            suffix: '_small',
            extname: '.webp'
          }
        },
        {
          width: 200 * 2, // image_small@2x is 400px wide
          rename: {
            suffix: '_small@2x',
            extname: '.webp'
          }
        },
        {
          width: 512, // image_medium is 512px wide
          rename: {
            suffix: '_medium',
            extname: '.webp'
          }
        },
        {
          width: 512 * 2, // image_medium@2x is 1024px wide
          rename: {
            suffix: '_medium@2x',
            extname: '.webp'
          }
        },
        {
          width: 800, // image_large is 800px wide
          rename: {
            suffix: '_large',
            extname: '.webp'
          }
        }
      ],
      // WebP files are generated in original format only
      '*.webp': [
        {
          width: 200, // image_small is 200px wide
          rename: {suffix: '_small'}
        },
        {
          width: 200 * 2, // image_small@2x is 400px wide
          rename: {suffix: '_small@2x'}
        },
        {
          width: 512, // image_medium is 512px wide
          rename: {suffix: '_medium'}
        },
        {
          width: 512 * 2, // image_medium@2x is 1024px wide
          rename: {suffix: '_medium@2x'}
        },
        {
          width: 800, // image_large is 800px wide
          rename: {suffix: '_large'}
        }
      ]
    }, {
      // Optimization configurations:
      quality: 70,                // Output qualify for JPEG, PNG and WebP
      compressionLevel: 6,        // Zlib compression level of PNG format
      errorOnEnlargement: false,  // Do not emit error when image is enlarged
      errorOnUnusedConfig: false, // Do not emit error when configuration is not used
      errorOnUnusedImage: false,  // Do not emit error when image is not used
      passThroughUnused: true,    // Keep unmatched images in the stream
      skipOnEnlargement: true,    // Do not write an output image if enlarged from original
      progressive: true,          // Use progressive (ie, interlace) scan for JPEG and PNG
      withMetadata: false         // Strip all metadata
    }))
    .pipe($.imagemin({
      optimizationLevel: 5,       // Desired optimization level of PNG output
      progressive: true           // Apply lossless conversion to progressive JPEG output
    }))
    .pipe(gulp.dest(PATHS.DIST_IMG))
    .pipe($.notify({
      message: 'Building responsive images... complete!',
      onLast: true
  }));
});

// -----------------------------------------------------------------
//  Tasks: Generate, inject and build Favicons
// -----------------------------------------------------------------
/* gulp.task('generate:favicon', done => {
  realFavicon.generateFavicon({
    masterPicture: 'src/images/icons/app-icon.svg',
    dest: 'dist/',
    iconsPath: '/',
    design: {
      ios: {
        appName: 'Restaurant Reviews',
        assets: {
          declareOnlyDefaultIcon: true,
          ios6AndPriorIcons: false,
          ios7AndLaterIcons: false,
          precomposedIcons: false
        },
        backgroundColor: '#FFFFFF',
        margin: '18%',
        pictureAspect: 'backgroundAndMargin'
      },
      desktopBrowser: {},
      windows: {
        appName: 'Restaurant Reviews',
        assets: {
          windows80Ie10Tile: false,
          windows10Ie11EdgeTiles: {
            big: false,
            medium: true,
            small: false,
            rectangle: false
          }
        },
        backgroundColor: '#DA532C',
        onConflict: 'override',
        pictureAspect: 'noChange'
      },
      androidChrome: {
        assets: {
          legacyIcon: false,
          lowResolutionIcons: false
        },
        manifest: {
          declared: true,
          display: 'standalone',
          name: 'Restaurant Reviews',
          onConflict: 'override',
          orientation: 'notSet',
          startUrl: '.',
          themeColor: '#145B8F'
        },
        assets: {
          legacyIcon: false,
          lowResolutionIcons: false
        }
      },
      safariPinnedTab: {
        pictureAspect: 'blackAndWhite',
        themeColor: '#0275D8',
        threshold: 55
      }
    },
    settings: {
      compression: 2,
      scalingAlgorithm: 'Mitchell',
      errorOnImageTooSmall: false,
      readmeFile: false,
      htmlCodeFile: false,
      usePathAsIs: false
    },
    markupFile: FAVICON_DATA_FILE
  }, () => {
    done();
    $.notify({
      message: 'Generating Favicons... complete!'
    });
  });
});

// Check RealFaviconGenerator for updates (make sure to run regularly!)
gulp.task('update:favicon', done => {
  const currentVersion = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).version;
  realFavicon.checkForUpdates(currentVersion, error => {
    if (error) {
      throw error;
    }
  });
}); */