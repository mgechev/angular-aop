module.exports = function (grunt) {

  'use strict';

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
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
    concat: {
      dist: {
        files: {
          'build/angular-aop.js': [
            './src/aspects/aspect.js',
            './src/angular-aop.js',
            './src/aspects/jointpoints/*.js'
          ]
        },
        options: {
          banner: '(function () {\n\'use strict\';\n',
          footer: '\n}());',
          process: function (src) {
            return src
             .replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
          }
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
  grunt.registerTask('buildStaging', ['test', 'jscs', 'concat']);
  grunt.registerTask('build', ['test', 'jscs', 'uglify', 'concat']);

  grunt.registerTask('default', 'build');
};
