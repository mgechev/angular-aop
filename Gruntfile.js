module.exports = function (grunt) {

  'use strict';

  grunt.loadNpmTasks('grunt-contrib-uglify');

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
    }
  });

  grunt.registerTask('default', 'uglify');
};
