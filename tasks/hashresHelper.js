/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2013 Luismahou
 * Licensed under the MIT license.
 */

'use strict';

const fs = require('fs'),
  path = require('path'),
  graphlib = require('graphlib'),
  utils = require('./hashresUtils');

exports.hashAndSub = function(grunt, options) {
  const encoding = options.encoding,
    fileNameFormat = options.fileNameFormat,
    renameFiles = options.renameFiles,
    nameToNameSearch = {},
    formatter = utils.compileFormat(fileNameFormat),
    searchFormatter = utils.compileSearchFormat(fileNameFormat);

  grunt.log.debug('files: ' + options.files);
  grunt.log.debug('Using encoding ' + encoding);
  grunt.log.debug('Using fileNameFormat ' + fileNameFormat);
  grunt.log.debug(renameFiles ? 'Renaming files' : 'Not renaming files');

  const createRegexFromCharArray = (chars) => '([' + chars.map(utils.preg_quote).join('') + '])';
  const referenceSearchBeginRegexp =  createRegexFromCharArray(['"', "'", '/', '=', ' ', '(']);
  const referenceSearchEndRegexp = createRegexFromCharArray(['"', "'", '>', ' ', ')', '?', '#']);
  const wrapFilenameRegexStr = (str) => referenceSearchBeginRegexp + str + referenceSearchEndRegexp;

  if (options.files) {
    for (const fileBatch of options.files) {
      // fileDependencyGraph stores nodes as basename => Set(real paths)
      const fileDependencyGraph = new graphlib.Graph({directed: true});
      const srcRealpathMap = {};

      for (const srcFile of fileBatch.src) {
        const basename = path.basename(srcFile),
          realpath = fs.realpathSync(srcFile),
          lastIndex = basename.lastIndexOf('.');

        nameToNameSearch[basename] = searchFormatter({
          hash: /[0-9a-f]{8}/,
          name: basename.slice(0, lastIndex),
          ext: basename.slice(lastIndex + 1, basename.length)
        });
        srcRealpathMap[realpath] = 1;

        if (! fileDependencyGraph.hasNode(basename)) {
          fileDependencyGraph.setNode(basename, new Set([realpath]));
        } else {
          fileDependencyGraph.node(basename).add(realpath);
        }
      }

      // sort by length 
      // It is very useful when we have bar.js and foo-bar.js 
      // @crodas
      const basenames = fileDependencyGraph.nodes();
      basenames.sort((a, b) => b[0].length - a[0].length);

      // First we need to find dependencies between files.
      for (const destFile of grunt.file.expand(fileBatch.dest)) {
        const destContents = fs.readFileSync(destFile, encoding);
        const destBasename = path.basename(destFile);
        const destRealpath = fs.realpathSync(destFile);

        if (! fileDependencyGraph.hasNode(destBasename)) {
          fileDependencyGraph.setNode(destBasename, new Set([destRealpath]));
        } else {
          fileDependencyGraph.node(destBasename).add(destRealpath);
        }

        for (const basename of basenames) {
          const matches = destContents.match(
            new RegExp(wrapFilenameRegexStr(utils.preg_quote(basename) + "(\\?[0-9a-z]+)?"))
          ) !== null || destContents.match(new RegExp(wrapFilenameRegexStr(nameToNameSearch[basename]))) !== null;

          if (matches) {
            fileDependencyGraph.setEdge(destBasename, basename);
          }
        }
      }

      // dag stores nodes as "arbitrary ID" => [basenames]
      const dag = utils.mergeGraphCycles(fileDependencyGraph);
      const dagNodeHashesMap = {};

      // Each dagNodeId has one or more basenames associated with it in dag.
      // Each basename has one or more realpaths associated with it in fileDependencyGraph.
      // Dependencies are hashed before the files that depend on them.
      for (const dagNodeId of graphlib.alg.topsort(dag).reverse()) {
        for (const dependencyDagNodeId of dag.successors(dagNodeId)) {
          const dependencyRenamedMap = {};

          for (const dependencyBasename of dag.node(dependencyDagNodeId)) {
            const lastIndex = dependencyBasename.lastIndexOf('.');
            dependencyRenamedMap[dependencyBasename] = formatter({
              hash: dagNodeHashesMap[dependencyDagNodeId],
              name: dependencyBasename.slice(0, lastIndex),
              ext : dependencyBasename.slice(lastIndex + 1, dependencyBasename.length)
            });
          }

          for (const destBasename of dag.node(dagNodeId)) {
            for (const destRealpath of fileDependencyGraph.node(destBasename)) {
              let destContents = fs.readFileSync(destRealpath, encoding);

              for (const dependencyBasename of dag.node(dependencyDagNodeId)) {
                const renamed = dependencyRenamedMap[dependencyBasename];
                grunt.log.debug('Substituting ' + dependencyBasename + ' by ' + renamed);
                destContents = destContents.replace(
                  new RegExp(wrapFilenameRegexStr(utils.preg_quote(dependencyBasename)+"(\\?[0-9a-z]+)?"), "g"),
                  '$1' + utils.quoteReplacementString(renamed) + '$3'
                );

                grunt.log.debug('Substituting ' + nameToNameSearch[dependencyBasename] + ' by ' + renamed);
                destContents = destContents.replace(
                  new RegExp(wrapFilenameRegexStr(nameToNameSearch[dependencyBasename]), "g"),
                  '$1' + utils.quoteReplacementString(renamed) + '$2'
                );
              }
              fs.writeFileSync(destRealpath, destContents, encoding);
            }
          }
        }

        // Each of dag node can reference multiple files. The files have already been updated to reference
        // hashed dependencies. All the files will get one common hash to deal with cycles and relative paths.
        const subhashes = [];

        for (const basename of dag.node(dagNodeId)) {
          for (const realpath of fileDependencyGraph.node(basename)) {
            subhashes.push(utils.md5File(realpath));
          }
        }

        const md5 = dagNodeHashesMap[dagNodeId] =
          (subhashes.length === 1 ? subhashes[0] : utils.md5String(subhashes.join(''))).slice(0, 8);

        for (const basename of dag.node(dagNodeId)) {
          const lastIndex = basename.lastIndexOf('.'),
            renamed = formatter({
              hash: md5,
              name: basename.slice(0, lastIndex),
              ext: basename.slice(lastIndex + 1, basename.length)
            });

          for (const realpath of fileDependencyGraph.node(basename)) {
            if (renameFiles && srcRealpathMap.hasOwnProperty(realpath)) {
              fs.renameSync(realpath, path.resolve(path.dirname(realpath), renamed));
            }
            grunt.log.write(realpath + ' ').ok(renamed);
          }
        }
      }
    }
  }
};
