module.exports = function (grunt) {

  'use strict';

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-jscs');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      dist: {
        files: {
          'build/angular-aop.min.js': [
            './src/aspects/aspect.js',
            './src/angular-aop.js',
            './src/aspects/jointpoints/*.js'
          ]
        },
        options: {
          wrap: true
        }
      }
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      },
      devunit: {
        configFile: 'karma.conf.js',
        singleRun: false
      }
    },
    jscs: {
      src: './src/**/*.js',
      options: {
        config: '.jscsrc'
      }
    }
  });

  grunt.registerTask('dev', 'karma:devunit');

  grunt.registerTask('test', 'karma:unit');
  grunt.registerTask('build', ['test', 'jscs', 'uglify']);

  grunt.registerTask('default', 'uglify');
};
