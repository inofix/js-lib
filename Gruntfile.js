module.exports = function (grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), 
    bower_concat: {
      all: {
        dest: {
          'js': 'build/_bower.js',
          'css': 'build/<%= pkg.name %>.css'
//          'css': 'build/_bower.css'
        },
        exclude: [
          'jquery',
          'modernizr'
        ],
        dependencies: {
          // 'underscore': 'jquery',
          // 'backbone': 'underscore',
          // 'jquery-mousewheel': 'jquery'
        },
        bowerOptions: {
          relative: false
        }
      }
    },
//    concat: {
//      options: {
//        // define a string to put between each file in the concatenated output
//        separator: ';'
//      },
//      dist: {
//        // the files to concatenate
//        src: ['src/**/*.js'],
//        // the location of the resulting JS file
//        dest: 'dist/<%= pkg.name %>.js'
//      }
//    }, 
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'build',
//           cwd: 'release/css',
          src: ['*.css', '!*.min.css'],
          dest: 'dist',
//          dest: 'release/css',
          ext: '.min.css'
        }]
      }
    },
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      // configure JSHint (documented at http://www.jshint.com/docs/)
      options: {
        globals: {
          jQuery: true,
          console: true,
          module: true
        }
      }
    },
    qunit: {
      files: ['test/**/*.html']
    },
    uglify: {
      options: {
        // the banner is inserted at the top of the output
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['<%= bower_concat.all.dest.js %>']   
          // 'dist/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'qunit']
    }
  });
  
  // Load the plugin that provides the "bower-concat" task.
  grunt.loadNpmTasks('grunt-bower-concat');
  
  // Load the plugin that provides the "cssmin" task.
  grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Load the plugin that provides the "concat" task.
//  grunt.loadNpmTasks('grunt-contrib-concat');

  // Load the plugin that provides the "jshint" task.
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Load the plugin that provides the "qunit" task.
  grunt.loadNpmTasks('grunt-contrib-qunit');

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Load the plugin that provides the "watch" task.
  grunt.loadNpmTasks('grunt-contrib-watch');
  
  // this would be run by typing "grunt test" on the command line
  grunt.registerTask('test', ['jshint', 'qunit']);

  // the default task can be run just by typing "grunt" on the command line
  grunt.registerTask('default', ['jshint', 'bower_concat', 'cssmin', 'uglify']);
  // grunt.registerTask('default', ['jshint', 'qunit', 'concat', 'uglify']);

};