module.exports = function (grunt) {

  'use strict';

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-karma');

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
        configFile: 'karma.conf.js'
      }
    }
  });

  grunt.registerTask('test', 'karma');

  grunt.registerTask('default', 'uglify');
};
