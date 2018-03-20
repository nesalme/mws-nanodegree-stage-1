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
          engine: 'im', // Using ImageMagick (to use GraphicsMagick, replace with 'gm')
          sizes: [
            {
              name: 'small',
              width: 400,
              suffix: '@1x',
              separator: '_',
              quality: 60
            },
            {
              name: 'small',
              width: 800,
              suffix: '@2x',
              separator: '_',
              quality: 60
            },
            {
              name: 'medium',
              width: 600,
              separator: '_',
              quality: 60
            },
            {
              name: 'large',
              width: 800,
              separator: '_',
              quality: 60
            }
          ],
        },
        files: [
          {
            expand: true,
            src:    ['**/*.{jpg,png}'],
            cwd:    'img_src/',
            dest:   'img/'
          }
        ],
      },
    },

    /* Clean out the images directory if it exists (after running responsive-images) */
    clean: {
      dev: {
        src: ['img'],
      },
    },

    /* Generate the images directory if  */
    mkdir: {
      dev: {
        options: {
          create: ['img']
        }
      }
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
            cwd:    'img/',
            src:    ['**/*.{jpg,png}'],
            dest:   'img/'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.loadNpmTasks('grunt-cwebp');

  grunt.registerTask('default', [
    'clean',
    'mkdir',
    'responsive_images',
    'cwebp'
  ]);
};
