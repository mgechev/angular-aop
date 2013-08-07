module.export = function (grunt) {

    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.initConfig({
        pgk: grunt.file.readJSON('package.json'),
        uglify: {
            dist: {
                files: {
                    'build/angular-aop.min.js': ['./src/angular-aop.js']
                }
            }
        }
    });

    grunt.registerTask('default', ['uglify']);
};
