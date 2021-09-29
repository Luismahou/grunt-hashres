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
    options.files.forEach(function(f) {
      // fileDependencyGraph stores nodes as basename => [real paths]
      const fileDependencyGraph = new graphlib.Graph({directed: true});
      const srcRealpathMap = {};

      f.src.forEach(function (src) {
        const basename = path.basename(src),
          realpath = fs.realpathSync(src),
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
      });

      // sort by length 
      // It is very useful when we have bar.js and foo-bar.js 
      // @crodas
      const basenames = fileDependencyGraph.nodes();
      basenames.sort((a, b) => b[0].length - a[0].length);

      // Substituting references to the given files with the hashed ones.
      grunt.file.expand(f.dest).forEach(function(f) {
        const destContents = fs.readFileSync(f, encoding);
        const destNodeId = path.basename(f);
        const destRealpath = fs.realpathSync(f);

        if (! fileDependencyGraph.hasNode(destNodeId)) {
          fileDependencyGraph.setNode(destNodeId, new Set([destRealpath]));
        } else {
          fileDependencyGraph.node(destNodeId).add(destRealpath);
        }

        basenames.forEach(function(basename) {
          const matches = destContents.match(
            new RegExp(wrapFilenameRegexStr(utils.preg_quote(basename) + "(\\?[0-9a-z]+)?"))
          ) !== null || destContents.match(new RegExp(wrapFilenameRegexStr(nameToNameSearch[basename]))) !== null;

          if (matches) {
            fileDependencyGraph.setEdge(destNodeId, basename);
          }
        });
      });

      // dag stores nodes as "arbitrary ID" => [basenames]
      const dag = utils.mergeGraphCycles(fileDependencyGraph);
      const dagNodeHashesMap = {};

      graphlib.alg.topsort(dag).reverse().forEach(function (dagNodeId) {
        dag.successors(dagNodeId).forEach(function (succDagNodeId) {
          const succRenamedMap = {};

          dag.node(succDagNodeId).forEach(function (srcBasename) {
            const lastIndex = srcBasename.lastIndexOf('.');
            succRenamedMap[srcBasename] = formatter({
              hash: dagNodeHashesMap[succDagNodeId],
              name: srcBasename.slice(0, lastIndex),
              ext : srcBasename.slice(lastIndex + 1, srcBasename.length)
            });
          });

          dag.node(dagNodeId).forEach(function (dstBasename) {
            for (const dstFile of fileDependencyGraph.node(dstBasename)) {
              let destContents = fs.readFileSync(dstFile, encoding);

              for (const srcBaseName of dag.node(succDagNodeId)) {
                const renamed = succRenamedMap[srcBaseName];
                grunt.log.debug('Substituting ' + srcBaseName + ' by ' + renamed);
                destContents = destContents.replace(
                  new RegExp(wrapFilenameRegexStr(utils.preg_quote(srcBaseName)+"(\\?[0-9a-z]+)?"), "g"),
                  '$1' + utils.quoteReplacementString(renamed) + '$3'
                );

                grunt.log.debug('Substituting ' + nameToNameSearch[srcBaseName] + ' by ' + renamed);
                destContents = destContents.replace(
                  new RegExp(wrapFilenameRegexStr(nameToNameSearch[srcBaseName]), "g"),
                  '$1' + utils.quoteReplacementString(renamed) + '$2'
                );
              }
              fs.writeFileSync(dstFile, destContents, encoding);
            }
          });
        });

        const subhashes = [];

        dag.node(dagNodeId).forEach(function (srcBasename) {
          for (const srcRealpath of fileDependencyGraph.node(srcBasename)) {
            subhashes.push(utils.md5File(srcRealpath));
          }
        });

        const md5 = dagNodeHashesMap[dagNodeId] =
          (subhashes.length === 1 ? subhashes[0] : utils.md5String(subhashes.join(''))).slice(0, 8);

        dag.node(dagNodeId).forEach(function (srcBasename) {
          // This file is only in dest, not in source.
          if (typeof fileDependencyGraph.node(srcBasename) === 'undefined') {
            return;
          }

          const lastIndex = srcBasename.lastIndexOf('.'),
            renamed = formatter({
              hash: md5,
              name: srcBasename.slice(0, lastIndex),
              ext: srcBasename.slice(lastIndex + 1, srcBasename.length)
            });

          for (const srcRealpath of fileDependencyGraph.node(srcBasename)) {
            if (renameFiles && srcRealpathMap.hasOwnProperty(srcRealpath)) {
              fs.renameSync(srcRealpath, path.resolve(path.dirname(srcRealpath), renamed));
            }
            grunt.log.write(srcRealpath + ' ').ok(renamed);
          }
        });
      });
    });
  }
};
