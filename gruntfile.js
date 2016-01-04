module.exports = function(grunt) {
  "use strict";
  var distDir = "src/jsdoc/template/materialize";
  var distDirJS = distDir + "/static/js";
  var distDirCSS = distDir + "/static/css";
  var distDirTmpl = distDir + "/tmpl";
  var rawDir = distDir + "/raw";
  var rawDirJS = rawDir + "/js";
  var rawDirCSS = rawDir + "/css";
  var rawDirTmpl = rawDir + "/tmpl";
  var cssConcat = rawDirCSS + "/concat/combined.css";
  var cssMinified = distDirCSS + "/modpe-api.min.css";
  var jsMinified = distDirJS + "/modpe-api.min.js";
  var config = {
    pkg: grunt.file.readJSON("package.json"),
    clean: [
      "./docs",
      "./test-docs",
      cssConcat,
      distDirCSS + "/*",
      distDirJS + "/*"
    ],
    concat: {
      css: {
        files: [
          { src: rawDirCSS + "/*.css", dest: cssConcat }
        ]
      }
    },
    copy: {
      css: {
        files: [{
          expand: true,
          cwd: rawDirCSS,
          src: [ "*.css" ],
          dest: distDirCSS
        }]
      },
      js: {
        files: [{
          expand: true,
          cwd: rawDirJS,
          src: [ "*.js" ],
          dest: distDirJS
        }]
      }
    },
    cssmin: {
      options: {
        shorthandCompacting: false,
        roundingPrecision: -1,
        sourceMap: true,
        report: "min"
      },
      target: {
        files: [{ src: cssConcat, dest: cssMinified }]
      }
    },
    jsdoc: {
      dist: {
        src: ["./src"],
        jsdoc: "./node_modules/.bin/jsdoc --verbose",
        options: {
          destination: "./docs",
          configure: "jsdoc.json"
        }
      },
      test: {
        src: ["./test"],
        jsdoc: "./node_modules/.bin/jsdoc --verbose",
        options: {
          destination: "./test-docs",
          configure: "jsdoc.json"
        }
      }
    },
    processhtml: {
      dev: {
        options: {
          data: { materialize: "materialize.css" }
        },
        files: [{ src: rawDirTmpl + "/layout.tmpl", dest: distDirTmpl + "/layout.tmpl" }]
      },
      dist: {
        options: {
          data: { materialize: "materialize.min.css" }
        },
        files: [{ src: rawDirTmpl + "/layout.tmpl", dest: distDirTmpl + "/layout.tmpl" }]
      }
    },
    sass: {
      dev: {
        options: {
          sourceMap: false,
          outputStyle: "expanded"
        },
        files: [{ src: "materialize-src/sass/materialize.scss", dest: distDirCSS + "/materialize.css" }]
      },
      dist: {
        options: {
          sourceMap: true,
          outputStyle: "compressed"
        },
        files: [{ src: "materialize-src/sass/materialize.scss", dest: distDirCSS + "/materialize.min.css" }]
      }
    },
    uglify: {
      options: {
        report: "min",
        sourceMap: true,
        preserveComments: false,
        screwIE8: true
      },
      dist: {
        files: [{ src: rawDirJS + "/*.js", dest: jsMinified }]
      }
    }
  };

  var taskLibs = [
    "grunt-contrib-clean",
    "grunt-contrib-concat",
    "grunt-contrib-copy",
    "grunt-contrib-cssmin",
    "grunt-contrib-uglify",
    "grunt-jsdoc",
    "grunt-processhtml",
    "grunt-sass"
  ];

  var cleanTasks = [
    "clean"
  ];

  var devTasks = [
    "sass:dev",
    "processhtml:dev",
    "copy:css",
    "copy:js"
  ];

  var distTasks = [
    "sass:dist",
    "concat:css",
    "cssmin",
    "uglify",
    "processhtml:dist"
  ];

  var docTasks = [
    "jsdoc:dist"
  ];

  var testTasks = [
    "jsdoc:test"
  ];

  // initialize configuration
  grunt.initConfig(config);

  // Load task libraries
  taskLibs.forEach(function(lib) {
    grunt.loadNpmTasks(lib);
  });

  // Definitions of tasks
  grunt.registerTask("jsdoc-clean", cleanTasks);
  grunt.registerTask("jsdoc-dev", cleanTasks.concat(devTasks.concat(docTasks)));
  grunt.registerTask("jsdoc-dist", cleanTasks.concat(distTasks.concat(docTasks)));
  grunt.registerTask("jsdoc-test", cleanTasks.concat(devTasks.concat(testTasks)));

  // Default task
  grunt.registerTask("default", "jsdoc-dev");
};
