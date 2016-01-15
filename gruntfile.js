"use strict";
module.exports = function (grunt) {

    var build,              // root build directory
        buildStatic,        // build static file directory
        commonTasks,        // tasks to be completed for dev and dist builds
        config,             // grunt configuration object
        css,                // css directory
        customBasename,     // main customization file basename
        customCss,          // custom css file
        customCssMin,       // minified custom css file
        customJsMin,        // minified custom javascript file
        customSass,         // custom sass file
        customSassSrc,      // custom sass directory
        devTasks,           // tasks to be completed for development builds
        dist,               // root distribution directory
        distStatic,         // distribution static file directory
        distTasks,          // tasks to be completed for distribution builds
        font,               // font directory
        img,                // image directory
        js,                 // javascript directory
        jsdocCmd,           // the full jsdoc command to use
        jsdocConfig,        // the location of the jsdoc config file
        jsdocDest,          // the jsdoc destination directory
        jsdocSrc,           // the jsdoc src locations/files
        mcss,               // materialize-css node module directory
        mcssSassSrc,        // materialize css sass partials
        moreCustomBasename, // additional customization file basename
        moreCustomCss,      // additional custom css file
        moreCustomCssMin,   // additional minified custom css file
        pkgJSON,            // data from package.json file
        postSass,           // sass partials to import after customizations
        preSass,            // sass partials to import before customizations
        sass,               // sass directory
        src,                // root source directory
        srcStatic,          // source static file directory
        taskLibs,           // required grunt task libraries
        templateName,       // the name of the jsdoc template
        tmpl,               // template directory
        path;               // node.js path module

    // node modules
    path = require("path");

    // jsdoc settings
    jsdocCmd = "./node_modules/.bin/jsdoc --verbose";
    jsdocConfig = "./test/jsdoc.json";
    jsdocDest = "./test/docs";
    jsdocSrc = ["./test"];

    // file and directory paths
    templateName = "jsdoc-materialize";
    src = "template";
    build = path.join("build", templateName);
    dist = path.join("dist", templateName);
    mcss = "node_modules/materialize-css";
    srcStatic = path.join(src, "static");
    buildStatic = path.join(build, "static");
    distStatic = path.join(dist, "static");
    css = "css";
    font = "font";
    img = "img";
    js = "js";
    sass = "sass";
    tmpl = "tmpl";
    mcssSassSrc = path.join(mcss, sass, "components");
    customSassSrc = path.join(src, sass);
    customBasename = templateName;
    moreCustomBasename = "jm-additional";
    customSass = path.join(customSassSrc, customBasename + ".scss");
    customCss = path.join(css, customBasename + ".css");
    moreCustomCss = path.join(css, moreCustomBasename + ".css");
    customCssMin = path.join(css, customBasename + ".min.css");
    moreCustomCssMin = path.join(css, moreCustomBasename + ".min.css");
    customJsMin = path.join(js, customBasename + ".min.js");
    preSass = path.join(customSassSrc, "_pre_vars.scss");
    postSass = path.join(customSassSrc, "_post_vars.scss");
    pkgJSON = grunt.file.readJSON("package.json");

    // grunt config object
    config = {
        pkg: pkgJSON,
        clean: [
          "./build",
          "./dist",
          "./test/docs",
          preSass,
          postSass
        ],
        concat: {
            css: {
            files: [
                {
                    src: path.join(srcStatic, css, "*.css"),
                    dest: path.join(buildStatic, moreCustomCss)
                }
            ]
        }
        },
        copy: {
            dev: {
                files: [
                    {
                        expand: true,
                        cwd: src,
                        src: "publish.js",
                        dest: build
                    },
                    {
                        expand: true,
                        cwd: path.join(src, tmpl),
                        src: ["*.tmpl", "!layout.tmpl"],
                        dest: path.join(build, tmpl)
                    },
                    {
                        expand: true,
                        cwd: path.join(srcStatic, css),
                        src: "*.css",
                        dest: path.join(buildStatic, css)
                    },
                    {
                        expand: true,
                        cwd: path.join(mcss, font),
                        src: "**/*",
                        dest: path.join(buildStatic, font)
                    },
                    {
                        expand: true,
                        cwd: path.join(srcStatic, img),
                        src: "**/*",
                        dest: path.join(buildStatic, img)
                    },
                    {
                        expand: true,
                        cwd: path.join(srcStatic, js),
                        src: "*.js",
                        dest: path.join(buildStatic, js)
                    }
                ]
            },
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: build,
                        src: "publish.js",
                        dest: dist
                    },
                    {
                        expand: true,
                        cwd: path.join(build, tmpl),
                        src: ["*.tmpl", "!layout.tmpl"],
                        dest: path.join(dist, tmpl)
                    },
                    {
                        expand: true,
                        cwd: path.join(mcss, font),
                        src: "**/*",
                        dest: path.join(distStatic, font)
                    },
                    {
                        expand: true,
                        cwd: path.join(buildStatic, img),
                        src: "**/*",
                        dest: path.join(distStatic, img)
                    }
                ]
            }
        },
        cssmin: {
            options: {
                shorthandCompacting: false,
                roundingPrecision: -1,
                sourceMap: true,
                report: "min"
            },
            dist: {
                files: [
                    {
                        src: path.join(buildStatic, customCss),
                        dest: path.join(distStatic, customCssMin)
                    },
                    {
                        src: path.join(buildStatic, moreCustomCss),
                        dest: path.join(distStatic, moreCustomCssMin)
                    }
                ]
            }
        },
        jsdoc: {
            dev: {
                src: jsdocSrc,
                jsdoc: jsdocCmd,
                options: {
                    destination: jsdocDest,
                    template: build,
                    configure: jsdocConfig
                }
            },
            dist: {
                src: jsdocSrc,
                jsdoc: jsdocCmd,
                options: {
                    destination: jsdocDest,
                    template: dist,
                    configure: jsdocConfig
                }
            }
        },
        processhtml: {
            dev: {
                options: {
                    data: { mainCss: customCss, moreCss: moreCustomCss }
                },
                files: [{
                    src: path.join(src, tmpl, "layout.tmpl"),
                    dest: path.join(build, tmpl, "layout.tmpl")
                }]
            },
            dist: {
                options: {
                    data: { mainCss: customCssMin, moreCss: moreCustomCssMin }
                },
                files: [{
                    src: path.join(src, tmpl, "layout.tmpl"),
                    dest: path.join(dist, tmpl, "layout.tmpl")
                }]
            }
        },
        sass: {
            dev: {
                options: {
                    sourceMap: false,
                    outputStyle: "expanded"
                },
                files: [{ src: customSass, dest: path.join(buildStatic, customCss) }]
            }
        },
        sass_globbing: {
            dist: {
                files: [
                    {
                        src: [path.join(mcssSassSrc, "_mixins.scss"), path.join(mcssSassSrc, "_color.scss")],
                        dest: preSass
                    },
                    {
                        src: [path.join(mcssSassSrc, "**/*.scss"), path.join("!", mcssSassSrc, "**/_variables.scss")],
                        dest: postSass
                    }
                ]
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
                files: [
                    {
                        src: path.join(buildStatic, js, "init.js"),
                        dest: path.join(distStatic, js, "init.min.js")
                    },
                    {
                        src: path.join(buildStatic, js, "highlight.pack.js"),
                        dest: path.join(distStatic, js, "highlight.pack.min.js")
                    },
                    {
                        src: path.join(buildStatic, js, "hljs-line-numbers.js"),
                        dest: path.join(distStatic, js, "hljs-line-numbers.min.js")
                    }
                ]
            }
        }
    };

    taskLibs = [
        "grunt-contrib-clean",
        "grunt-contrib-concat",
        "grunt-contrib-copy",
        "grunt-contrib-cssmin",
        "grunt-contrib-uglify",
        "grunt-jsdoc",
        "grunt-processhtml",
        "grunt-sass",
        "grunt-sass-globbing"
    ];

    commonTasks = [
        "clean",
        "sass_globbing:dist",
        "sass:dev",
        "concat:css",
        "copy:dev"
    ];

    devTasks = [
        "processhtml:dev",
        "jsdoc:dev"
    ];

    distTasks = [
        "cssmin:dist",
        "uglify",
        "processhtml:dist",
        "copy:dist",
        "jsdoc:dist"
    ];

    // initialize configuration
    grunt.initConfig(config);

    // Load task libraries
    taskLibs.forEach(function (lib) {
        grunt.loadNpmTasks(lib);
    });

    // Definitions of tasks
    grunt.registerTask("dev", commonTasks.concat(devTasks));
    grunt.registerTask("dist", commonTasks.concat(distTasks));

    // Default task
    grunt.registerTask("default", "dev");
};
