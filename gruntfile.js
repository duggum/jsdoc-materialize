module.exports = function(grunt) {
  "use strict";
  var srcDir = "template";
  var distDir = "dist/jsdoc-materialize";
  var cssDir = "/static/css";
  var fontDir = "/static/font";
  var imgDir = "/static/img";
  var jsDir = "/static/js";
  var tmplDir = "/tmpl";
  var cssConcat = srcDir + cssDir + "/concat/combined.css";
  var cssMinified = distDir + cssDir + "/jsdoc-materialize.min.css";
  var jsMinified = distDir + jsDir + "/jsdoc-materialize.min.js";
  var pkgJSON = grunt.file.readJSON("package.json");
  var materializeVersion = pkgJSON.devDependencies["materialize-css"].replace("^", "");
  var config = {
    pkg: pkgJSON,
    clean: [
      cssConcat,
      "./dist",
      "./test/docs"
    ],
    concat: {
      css: {
        files: [
          { src: srcDir + cssDir + "/*.css", dest: cssConcat }
        ]
      }
    },
    copy: {
      css: {
        files: [{
          expand: true,
          cwd: srcDir + cssDir,
          src: [ "*.css" ],
          dest: distDir + cssDir
        }]
      },
      font: {
        files: [{
          expand: true,
          cwd: srcDir + fontDir,
          src: [ "**/*" ],
          dest: distDir + fontDir
        }]
      },
      img: {
        files: [{
          expand: true,
          cwd: srcDir + imgDir,
          src: [ "**/*" ],
          dest: distDir + imgDir
        }]
      },
      js: {
        files: [{
          expand: true,
          cwd: srcDir + jsDir,
          src: [ "*.js" ],
          dest: distDir + jsDir
        }]
      },
      main: {
        files: [{
          expand: true,
          cwd: srcDir,
          src: [ "publish.js" ],
          dest: distDir
        }]
      },
      tmpl: {
        files: [{
          expand: true,
          cwd: srcDir + tmplDir,
          src: [ "*.tmpl", "!layout.tmpl" ],
          dest: distDir + tmplDir
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
        src: ["./test"],
        jsdoc: "./node_modules/.bin/jsdoc --verbose",
        options: {
          destination: "./test/docs",
          configure: "jsdoc.json"
        }
      }
    },
    processhtml: {
      dev: {
        options: {
          data: { materialize: "materialize.css" }
        },
        files: [{ src: srcDir + tmplDir + "/layout.tmpl", dest: distDir + tmplDir + "/layout.tmpl" }]
      },
      dist: {
        options: {
          data: { materialize: "materialize.min.css" }
        },
        files: [{ src: srcDir + tmplDir + "/layout.tmpl", dest: distDir + tmplDir + "/layout.tmpl" }]
      }
    },
    sass: {
      dev: {
        options: {
          sourceMap: false,
          outputStyle: "expanded"
        },
        files: [{ src: "materialize-src/sass/materialize.scss", dest: distDir + cssDir + "/materialize.css" }]
      },
      dist: {
        options: {
          sourceMap: true,
          outputStyle: "compressed"
        },
        files: [{ src: "materialize-src/sass/materialize.scss", dest: distDir + cssDir + "/materialize.min.css" }]
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
        files: [{ src: srcDir + jsDir + "/*.js", dest: jsMinified }]
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

  var devTasks = [
    "clean",
    "sass:dev",
    "processhtml:dev",
    "copy"
  ];

  var distTasks = [
    "clean",
    "sass:dist",
    "concat:css",
    "cssmin",
    "uglify",
    "processhtml:dist",
    "copy"
  ];

  // initialize configuration
  grunt.initConfig(config);

  // Load task libraries
  taskLibs.forEach(function(lib) {
    grunt.loadNpmTasks(lib);
  });

  // Definitions of tasks
  grunt.registerTask("dev", devTasks);
  grunt.registerTask("dist", distTasks);
  grunt.registerTask("test", devTasks.concat("jsdoc:dist"));

  // Default task
  grunt.registerTask("default", "test");
};
