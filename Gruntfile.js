/*
  COMMANDS:
  $ grunt                   --- creates a new, completed images directory
  $ grunt clean             --- removes the images directory
  $ grunt responsive_images --- re-processes images without removing the old ones
*/

module.exports = function(grunt) {

  /* Project configuration */
  grunt.initConfig({
    /* Generate responsive images */
    responsive_images: {
      dev: {
        options: {
          engine: 'gm', // Using GraphicsMagick (to use ImageMagick, replace with 'im')
          sizes: [
            { name: 'small',  separator: '_', suffix: '_1x', quality: 60, width: 600  },
            { name: 'small',  separator: '_', suffix: '_2x', quality: 60, width: 1200 },
            { name: 'medium', separator: '_', suffix: '_2x', quality: 60, width: 900  },
            { name: 'medium', separator: '_', suffix: '_1x', quality: 60, width: 1800 },
            { name: 'large',  separator: '_', suffix: '_1x', quality: 60, width: 1440 },
            { name: 'large',  separator: '_', suffix: '_2x', quality: 60, width: 2880 }
          ],
        },
        files: [
          {
            expand: true,
            src:    ['**/*.{jpg,png}'],
            cwd:    'images_src/',
            dest:   'images/'
          }
        ],
      },
    },

    /* Convert JPG and PNG images to WebP */
    cwebp: {
      dynamic: {
        options: {
          q: 60
        },
        files: [
          {
            expand: true,
            cwd:    'images/',
            src:    ['**/*.{jpg,png}'],
            dest:   'images/'
          }
        ]
      }
    },

    /* Clean out the images directory if it exists (after running responsive-images) */
    clean: {
      dev: {
        src: ['images'],
      },
    },

    /* Generate the images directory if  */
    mkdir: {
      dev: {
        options: {
          create: ['images']
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-cwebp');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-responsive-images');

  grunt.registerTask('default', [
    'clean',
    'cwebp',
    'mkdir',
    'responsive_images'
  ]);
};
