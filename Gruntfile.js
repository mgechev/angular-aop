module.exports = function (grunt) {

  'use strict';

  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      dist: {
        files: {
          'build/angular-aop.min.js': ['./src/angular-aop.js']
        }
      }
    }
  });

  grunt.registerTask('default', 'uglify');
};
