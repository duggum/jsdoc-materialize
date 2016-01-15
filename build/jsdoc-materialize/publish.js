'use strict';

var util = require('util'),
    taffy = require('taffydb').taffy,
    doop = require('jsdoc/util/doop'),
    env = require('jsdoc/env'),
    fs = require('jsdoc/fs'),
    helper = require('jsdoc/util/templateHelper'),
    logger = require('jsdoc/util/logger'),
    markdown = require('jsdoc/util/markdown'),
    path = require('jsdoc/path'),
    template = require('jsdoc/template'),
    hasOwnProp = Object.prototype.hasOwnProperty,
    htmlsafe = helper.htmlsafe,
    linkto = helper.linkto,
    materialize = env.conf.materialize,
    outdir = path.normalize(env.opts.destination),
    resolveAuthorLinks = helper.resolveAuthorLinks,
    scopeToPunc = helper.scopeToPunc,
    data,
    view;

function isMaterialize() {
    if (typeof materialize === "undefined") {
        return false;
    } else {
        return true;
    }
}

function toTitleCase(str) {
    // \u00C0-\u00ff for a happy Latin-1
    return str.toLowerCase().replace(/_/g, ' ').replace(/\b([a-z\u00C0-\u00ff])/g, function (_, initial) {
        return initial.toUpperCase();
    }).replace(/(\s(?:de|a|o|e|da|do|em|ou|[\u00C0-\u00ff]))\b/ig, function (_, match) {
        return match.toLowerCase();
    });
}

function find(spec) {
    return helper.find(data, spec);
}

function tutoriallink(tutorial) {
    return helper.toTutorial(tutorial, null, { tag: 'em', classname: 'disabled', prefix: 'Tutorial: ' });
}

function getAncestorLinks(doclet) {
    return helper.getAncestorLinks(data, doclet);
}

function hashToLink(doclet, hash) {
    var url = helper.createLink(doclet);

    if (!/^(#.+)/.test(hash)) {
        return hash;
    }


    url = url.replace(/(#.+|$)/, hash);
    return '<a href="' + url + '">' + hash + '</a>';
}

function needsSignature(doclet) {
    var i, l,
        needsSig = false;

    // function and class definitions always get a signature
    if (doclet.kind === 'function' || doclet.kind === 'class') {
        needsSig = true;
    } else if (
        doclet.kind === 'typedef' &&
        doclet.type && doclet.type.names &&
        doclet.type.names.length) {
        for (i = 0, l = doclet.type.names.length; i < l; i++) {
            if (doclet.type.names[i].toLowerCase() === 'function') {
                needsSig = true;
                break;
            }
        }
    }
    return needsSig;
}

function getSignatureAttributes(item) {
    var attributes = [];

    if (item.optional) {
        attributes.push('opt');
    }

    if (item.nullable === true) {
        attributes.push('nullable');
    } else if (item.nullable === false) {
        attributes.push('non-null');
    }

    return attributes;
}

function updateItemName(item) {
    var attributes = getSignatureAttributes(item),
        itemName = item.name || '';

    if (item.variable) {
        itemName = '&hellip;' + itemName;
    }

    if (attributes && attributes.length) {
        itemName = util.format('%s<span class="signature-attributes">%s</span>', itemName,
            attributes.join(', '));
    }

    return itemName;
}

function addParamAttributes(params) {
    return params.filter(function (param) {
        return param.name && param.name.indexOf('.') === -1;
    }).map(updateItemName);
}

function buildItemTypeStrings(item) {
    var types = [];

    if (item && item.type && item.type.names) {
        item.type.names.forEach(function (name) {
            types.push(linkto(name, htmlsafe(name)));
        });
    }

    return types;
}

function buildAttribsString(attribs) {
    var attribsString = '';

    if (attribs && attribs.length) {
        attribsString = htmlsafe(util.format('(%s) ', attribs.join(', ')));
    }

    return attribsString;
}

function addNonParamAttributes(items) {
    var types = [];

    items.forEach(function (item) {
        types = types.concat(buildItemTypeStrings(item));
    });

    return types;
}

function addSignatureParams(f) {
    var params = f.params ? addParamAttributes(f.params) : [];

    f.signature = util.format('%s(%s)', (f.signature || ''), params.join(', '));
}

function addSignatureReturns(f) {
    var attribs = [],
        attribsString = '',
        returnTypes = [],
        returnTypesString = '';

    // jam all the return-type attributes into an array. this could create odd results (for example,
    // if there are both nullable and non-nullable return types), but let's assume that most people
    // who use multiple @return tags aren't using Closure Compiler type annotations, and vice-versa.
    if (f.returns) {
        f.returns.forEach(function (item) {
            helper.getAttribs(item).forEach(function (attrib) {
                if (attribs.indexOf(attrib) === -1) {
                    attribs.push(attrib);
                }
            });
        });

        attribsString = buildAttribsString(attribs);
    }

    if (f.returns) {
        returnTypes = addNonParamAttributes(f.returns);
    }
    if (returnTypes.length) {
        returnTypesString = util.format(' &rarr; %s{%s}', attribsString, returnTypes.join('|'));
    }

    f.signature = '<span class="signature">' + (f.signature || '') + '</span>' +
        '<span class="type-signature">' + returnTypesString + '</span>';
}

function addSignatureTypes(f) {
    var types = f.type ? buildItemTypeStrings(f) : [];

    f.signature = (f.signature || '') + '<span class="type-signature">' +
        (types.length ? ' :' + types.join('|') : '') + '</span>';
}

function addAttribs(f) {
    var attribs = helper.getAttribs(f),
        attribsString = buildAttribsString(attribs);

    f.attribs = util.format('<span class="type-signature">%s</span>', attribsString);
}

function shortenPaths(files, commonPrefix) {
    Object.keys(files).forEach(function (file) {
        files[file].shortened = files[file].resolved.replace(commonPrefix, '')
            // always use forward slashes
            .replace(/\\/g, '/');
    });

    return files;
}

function getPathFromDoclet(doclet) {
    if (!doclet.meta) {
        return null;
    }

    return doclet.meta.path && doclet.meta.path !== 'null' ?
        path.join(doclet.meta.path, doclet.meta.filename) :
        doclet.meta.filename;
}

function generate(title, docs, filename, resolveLinks) {
    var docData,
        outpath,
        html;

    resolveLinks = resolveLinks === false ? false : true;

    docData = {
        env: env,
        title: title,
        docs: docs
    };

    outpath = path.join(outdir, filename);
    html = view.render('container.tmpl', docData);

    if (resolveLinks) {
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
    }

    fs.writeFileSync(outpath, html, 'utf8');
}

function generateSourceFiles(sourceFiles, encoding) {
    var enc = encoding || 'utf8';
    Object.keys(sourceFiles).forEach(function (file) {
        var source,
            sourceOutfile;

        // links are keyed to the shortened path in each doclet's `meta.shortpath` property
        sourceOutfile = helper.getUniqueFilename(sourceFiles[file].shortened);
        helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

        try {
            source = {
                kind: 'source',
                code: helper.htmlsafe(fs.readFileSync(sourceFiles[file].resolved, enc))
            };
        }
        catch (e) {
            logger.error('Error while generating source file %s: %s', file, e.message);
        }

        generate('Source: ' + sourceFiles[file].shortened, [source], sourceOutfile,
            false);
    });
}

/**
 * Look for classes or functions with the same name as modules (which indicates that the module
 * exports only that class or function), then attach the classes or functions to the `module`
 * property of the appropriate module doclets. The name of each class or function is also updated
 * for display purposes. This function mutates the original arrays.
 *
 * @private
 * @param {Array.<module:jsdoc/doclet.Doclet>} doclets - The array of classes and functions to
 * check.
 * @param {Array.<module:jsdoc/doclet.Doclet>} modules - The array of module doclets to search.
 */
function attachModuleSymbols(doclets, modules) {
    var symbols = {};

    // build a lookup table
    doclets.forEach(function (symbol) {
        symbols[symbol.longname] = symbols[symbol.longname] || [];
        symbols[symbol.longname].push(symbol);
    });

    return modules.map(function (module) {
        if (symbols[module.longname]) {
            module.modules = symbols[module.longname]
                // Only show symbols that have a description. Make an exception for classes, because
                // we want to show the constructor-signature heading no matter what.
                .filter(function (symbol) {
                    return symbol.description || symbol.kind === 'class';
                })
                .map(function (symbol) {
                    symbol = doop(symbol);

                    if (symbol.kind === 'class' || symbol.kind === 'function') {
                        symbol.name = symbol.name.replace('module:', '(require("') + '"))';
                    }

                    return symbol;
                });
        }
    });
}

function buildMemberNav(items, itemHeading, itemsSeen, linktoFn) {
    var displayName,
        itemsNav,
        nav = '';

    if (items.length) {
        itemsNav = '';
        items.forEach(function (item) {
            if (!hasOwnProp.call(item, 'longname')) {
                itemsNav += '<li>' + linktoFn('', item.name) + '</li>';
            } else if (!hasOwnProp.call(itemsSeen, item.longname)) {
                if (env.conf.templates.default.useLongnameInNav) {
                    displayName = item.longname;
                } else {
                    displayName = item.name;
                }
                displayName = displayName.replace(/\b(module|event):/g, '');
                itemsNav += '<li>' + linktoFn(item.longname, displayName) + '</li>';
                itemsSeen[item.longname] = true;
            }
        });

        if (itemsNav !== '') {
            nav += '<h3>' + itemHeading + '</h3><ul>' + itemsNav + '</ul>';
        }
    }

    return nav;
}

function linktoTutorial(longName, name) {
    return tutoriallink(name);
}

function linktoExternal(longName, name) {
    return linkto(longName, name.replace(/(^"|"$)/g, ''));
}

/**
 * Create the navigation sidebar.
 * @param {object} members The members that will be used to create the sidebar.
 * @param {array<object>} members.classes
 * @param {array<object>} members.externals
 * @param {array<object>} members.globals
 * @param {array<object>} members.mixins
 * @param {array<object>} members.modules
 * @param {array<object>} members.namespaces
 * @param {array<object>} members.tutorials
 * @param {array<object>} members.events
 * @param {array<object>} members.interfaces
 * @return {string} The HTML for the navigation sidebar.
 */
function buildNav(members) {
    var nav, globalNav,
        seen = {},
        seenTutorials = {};

    nav = '<h2><a href="index.html">Home</a></h2>';
    nav = nav + buildMemberNav(members.modules, 'Modules', {}, linkto);
    nav = nav + buildMemberNav(members.externals, 'Externals', seen, linktoExternal);
    nav = nav + buildMemberNav(members.classes, 'Classes', seen, linkto);
    nav = nav + buildMemberNav(members.events, 'Events', seen, linkto);
    nav = nav + buildMemberNav(members.namespaces, 'Namespaces', seen, linkto);
    nav = nav + buildMemberNav(members.mixins, 'Mixins', seen, linkto);
    nav = nav + buildMemberNav(members.tutorials, 'Tutorials', seenTutorials, linktoTutorial);
    nav = nav + buildMemberNav(members.interfaces, 'Interfaces', seen, linkto);

    if (members.globals.length) {
        globalNav = '';

        members.globals.forEach(function (g) {
            if (g.kind !== 'typedef' && !hasOwnProp.call(seen, g.longname)) {
                globalNav = globalNav + '<li>' + linkto(g.longname, g.name) + '</li>';
            }
            seen[g.longname] = true;
        });

        if (!globalNav) {
            // turn the heading into a link so you can actually get to the global page
            nav = nav + '<h3>' + linkto('global', 'Global') + '</h3>';
        } else {
            nav = nav + '<h3>Global</h3><ul>' + globalNav + '</ul>';
        }
    }
    return nav;
}

/**
    @param {TAFFY} taffyData See <http://taffydb.com/>.
    @param {object} opts
    @param {Tutorial} tutorials
 */
exports.publish = function (taffyData, opts, tutorials) {
    var caption, code, conf, templatePath, indexUrl, globalUrl, packageUrl,
        packageInfo,
        sourceFiles = {},
        sourceFilePaths = [],
        sourcePath,
        fromDir,
        staticFiles,
        staticFilePaths,
        staticFileFilter,
        staticFileScanner,
        members,
        outputSourceFiles,
        files,
        packages,
        classes,
        modules,
        namespaces,
        mixins,
        externals,
        interfaces,
        myModules,
        myClasses,
        myNamespaces,
        myMixins,
        myExternals,
        myInterfaces;

    data = taffyData;

    conf = env.conf.templates || {};
    conf.default = conf.default || {};

    templatePath = path.normalize(opts.template);
    view = new template.Template(path.join(templatePath, 'tmpl'));

    // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
    // doesn't try to hand them out later
    indexUrl = helper.getUniqueFilename('index');
    // don't call registerLink() on this one! 'index' is also a valid longname

    globalUrl = helper.getUniqueFilename('global');
    helper.registerLink('global', globalUrl);

    packageUrl = helper.getUniqueFilename('packages');
    helper.registerLink('packages', packageUrl);

    // set up templating
    view.layout = conf.default.layoutFile ?
        path.getResourcePath(path.dirname(conf.default.layoutFile),
            path.basename(conf.default.layoutFile)) :
        'layout.tmpl';

    // set up tutorials for helper
    helper.setTutorials(tutorials);

    data = helper.prune(data);
    data.sort('longname, version, since');
    helper.addEventListeners(data);

    sourceFiles = {};
    sourceFilePaths = [];
    data().each(function (doclet) {
        doclet.attribs = '';

        if (doclet.examples) {
            doclet.examples = doclet.examples.map(function (example) {

                if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
                    caption = RegExp.$1;
                    code = RegExp.$3;
                }

                return {
                    caption: caption || '',
                    code: code || example
                };
            });
        }
        if (doclet.see) {
            doclet.see.forEach(function (seeItem, i) {
                doclet.see[i] = hashToLink(doclet, seeItem);
            });
        }

        // build a list of source files
        if (doclet.meta) {
            sourcePath = getPathFromDoclet(doclet);
            sourceFiles[sourcePath] = {
                resolved: sourcePath,
                shortened: null
            };
            if (sourceFilePaths.indexOf(sourcePath) === -1) {
                sourceFilePaths.push(sourcePath);
            }
        }
    });

    // update outdir if necessary, then create outdir
    packageInfo = (find({
        kind: 'package'
    }) || [])[0];
    if (isMaterialize()) {
        if (materialize.isPackage && packageInfo && packageInfo.name) {
            outdir = path.join(outdir, packageInfo.name, (packageInfo.version || ''));
        }
    }
    fs.mkPath(outdir);

    // copy the template's static files to outdir
    fromDir = path.join(templatePath, 'static');
    staticFiles = fs.ls(fromDir, 3);

    staticFiles.forEach(function (fileName) {
        var toDir = fs.toDir(fileName.replace(fromDir, outdir));
        fs.mkPath(toDir);
        fs.copyFileSync(fileName, toDir);
    });

    // copy user-specified static files to outdir
    if (conf.default.staticFiles) {
        // The canonical property name is `include`. We accept `paths` for backwards compatibility
        // with a bug in JSDoc 3.2.x.
        staticFilePaths = conf.default.staticFiles.include ||
            conf.default.staticFiles.paths ||
            [];
        staticFileFilter = new (require('jsdoc/src/filter')).Filter(conf.default.staticFiles);
        staticFileScanner = new (require('jsdoc/src/scanner')).Scanner();

        staticFilePaths.forEach(function (filePath) {
            var extraStaticFiles,
                sourcePath,
                toDir;

            filePath = path.resolve(env.pwd, filePath);
            extraStaticFiles = staticFileScanner.scan([filePath], 10, staticFileFilter);

            extraStaticFiles.forEach(function (fileName) {
                sourcePath = fs.toDir(filePath);
                toDir = fs.toDir(fileName.replace(sourcePath, outdir));
                fs.mkPath(toDir);
                fs.copyFileSync(fileName, toDir);
            });
        });
    }

    if (sourceFilePaths.length) {
        sourceFiles = shortenPaths(sourceFiles, path.commonPrefix(sourceFilePaths));
    }
    data().each(function (doclet) {
        var docletPath,
            url = helper.createLink(doclet);
        helper.registerLink(doclet.longname, url);

        // add a shortened version of the full path
        if (doclet.meta) {
            docletPath = getPathFromDoclet(doclet);
            docletPath = sourceFiles[docletPath].shortened;
            if (docletPath) {
                doclet.meta.shortpath = docletPath;
            }
        }
    });

    data().each(function (doclet) {
        var url = helper.longnameToUrl[doclet.longname];

        if (url.indexOf('#') > -1) {
            doclet.id = helper.longnameToUrl[doclet.longname].split(/#/).pop();
        } else {
            doclet.id = doclet.name;
        }

        if (needsSignature(doclet)) {
            addSignatureParams(doclet);
            addSignatureReturns(doclet);
            addAttribs(doclet);
        }
    });

    // do this after the urls have all been generated
    data().each(function (doclet) {
        doclet.ancestors = getAncestorLinks(doclet);

        if (doclet.kind === 'member') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
        }

        if (doclet.kind === 'constant') {
            addSignatureTypes(doclet);
            addAttribs(doclet);
            doclet.kind = 'member';
        }
    });

    members = helper.getMembers(data);
    members.tutorials = tutorials.children;

    // output pretty-printed source files by default
    outputSourceFiles = conf.default && conf.default.outputSourceFiles !== false ? true :
        false;

    // add template helpers
    view.find = find;
    view.linkto = linkto;
    view.resolveAuthorLinks = resolveAuthorLinks;
    view.tutoriallink = tutoriallink;
    view.htmlsafe = htmlsafe;
    view.outputSourceFiles = outputSourceFiles;

    // once for all
    view.nav = buildNav(members);
    attachModuleSymbols(find({ longname: {left: 'module:'} }), members.modules);

    // generate the pretty-printed source files first so other pages can link to them
    if (outputSourceFiles) {
        generateSourceFiles(sourceFiles, opts.encoding);
    }

    if (members.globals.length) {
        generate('Global', [{kind: 'globalobj'}], globalUrl);
    }

    // index page displays information from package.json and lists files
    if (isMaterialize()) {
        if (opts.package && materialize.isPackage) {
            files = find({kind: 'file'});
            packages = find({kind: 'package'});
            generate('Packages',
        packages.concat([{
            kind: 'package',
            longname: 'packages'
        }]).concat(files),
        packageUrl
      );
        }
    }
    generate('Home',
    [{
        kind: 'index',
        readme: opts.readme,
        longname: (opts.mainpagetitle) ? opts.mainpagetitle : 'Home Page'
    }],
    indexUrl
  );

    // parse additional markdown files and create unique pages for them
    if (materialize.mdPages.length) {
        materialize.mdPages.forEach(function (element) {
            var src,
                html,
                title,
                url,
                parse = markdown.getParser(),
                dir = element.dir;

            if (element.files.length) {
                element.files.forEach(function (file) {
                    src = path.join(dir, file + ".md");
                    html = parse(fs.readFileSync(src, opts.encoding));
                    title = toTitleCase(file);
                    url = helper.getUniqueFilename(file);
                    helper.registerLink(file, url);
                    generate(
            title, [{
                kind: 'mainpage',
                longname: title,
                readme: html
            }],
            url,
            true
          );
                });
            }
        });
    }

    // set up the lists that we'll use to generate pages
    classes = taffy(members.classes);
    modules = taffy(members.modules);
    namespaces = taffy(members.namespaces);
    mixins = taffy(members.mixins);
    externals = taffy(members.externals);
    interfaces = taffy(members.interfaces);

    Object.keys(helper.longnameToUrl).forEach(function (longname) {
        myModules = helper.find(modules, {longname: longname});
        if (myModules.length) {
            generate('Module: ' + myModules[0].name, myModules, helper.longnameToUrl[longname]);
        }

        myClasses = helper.find(classes, {longname: longname});
        if (myClasses.length) {
            generate('Class: ' + myClasses[0].name, myClasses, helper.longnameToUrl[longname]);
        }

        myNamespaces = helper.find(namespaces, {longname: longname});
        if (myNamespaces.length) {
            generate('Namespace: ' + myNamespaces[0].name, myNamespaces, helper.longnameToUrl[longname]);
        }

        myMixins = helper.find(mixins, {longname: longname});
        if (myMixins.length) {
            generate('Mixin: ' + myMixins[0].name, myMixins, helper.longnameToUrl[longname]);
        }

        myExternals = helper.find(externals, {longname: longname});
        if (myExternals.length) {
            generate('External: ' + myExternals[0].name, myExternals, helper.longnameToUrl[longname]);
        }

        myInterfaces = helper.find(interfaces, {longname: longname});
        if (myInterfaces.length) {
            generate('Interface: ' + myInterfaces[0].name, myInterfaces, helper.longnameToUrl[longname]);
        }
    });

    // move the tutorial functions to templateHelper.js
    function generateTutorial(title, tutorial, filename) {
        var tutorialData,
            tutorialPath,
            html;

        tutorialData = {
            title: title,
            header: tutorial.title,
            content: tutorial.parse(),
            children: tutorial.children
        };
        tutorialPath = path.join(outdir, filename);

        // yes, you can use {@link} in tutorials too!
        // turn {@link foo} into <a href="foodoc.html">foo</a>
        html = helper.resolveLinks(view.render('tutorial.tmpl', tutorialData));

        fs.writeFileSync(tutorialPath, html, 'utf8');
    }

    // tutorials can have only one parent so there is no risk for loops
    function saveChildren(node) {
        node.children.forEach(function (child) {
            generateTutorial('Tutorial: ' + child.title, child, helper.tutorialToUrl(child.name));
            saveChildren(child);
        });
    }
    saveChildren(tutorials);
};
