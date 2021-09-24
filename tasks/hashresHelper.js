/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2013 Luismahou
 * Licensed under the MIT license.
 */

'use strict';

var fs    = require('fs'),
    path  = require('path'),
    graphlib  = require('graphlib'),
    utils = require('./hashresUtils');

exports.hashAndSub = function(grunt, options) {
  var encoding         = options.encoding,
      fileNameFormat   = options.fileNameFormat,
      renameFiles      = options.renameFiles,
      nameToNameSearch = {},
      formatter        = null,
      searchFormatter  = null;

  grunt.log.debug('files: ' + options.files);
  grunt.log.debug('Using encoding ' + encoding);
  grunt.log.debug('Using fileNameFormat ' + fileNameFormat);
  grunt.log.debug(renameFiles ? 'Renaming files' : 'Not renaming files');

  formatter = utils.compileFormat(fileNameFormat);
  searchFormatter = utils.compileSearchFormat(fileNameFormat);

  const createRegexFromCharArray = (chars) => '([' + chars.map(utils.preg_quote).join('') + '])';
  const referenceSearchBeginRegexp =  createRegexFromCharArray(['"', "'", '/', '=', ' ', '(']);
  const referenceSearchEndRegexp = createRegexFromCharArray(['"', "'", '>', ' ', ')', '?', '#']);
  const wrapFilenameRegexStr = (str) => referenceSearchBeginRegexp + str + referenceSearchEndRegexp;

  if (options.files) {
    options.files.forEach(function(f) {
      // fileDependencyGraph stores nodes as realpath => basename
      var fileDependencyGraph = new graphlib.Graph({ directed: true  });
      var basenameToRealpaths = {};

      f.src.forEach(function (src) {
        var fileName = path.basename(src),
          nodeId = fs.realpathSync(src),
          lastIndex = fileName.lastIndexOf('.');

        nameToNameSearch[fileName] = searchFormatter({
          hash: /[0-9a-f]{8}/,
          name: fileName.slice(0, lastIndex),
          ext: fileName.slice(lastIndex + 1, fileName.length)
        });

        fileDependencyGraph.setNode(nodeId, fileName);

        if (! basenameToRealpaths.hasOwnProperty(fileName)) {
          basenameToRealpaths[fileName] = [];
        }

        basenameToRealpaths[fileName].push(nodeId);
      });

      // sort by length 
      // It is very useful when we have bar.js and foo-bar.js 
      // @crodas
      var files = Object.keys(basenameToRealpaths);

      files.sort(function(a, b) {
        return b[0].length - a[0].length;
      });

      // Substituting references to the given files with the hashed ones.
      grunt.file.expand(f.dest).forEach(function(f) {
        var destContents = fs.readFileSync(f, encoding);
        var destNodeId = fs.realpathSync(f);

        files.forEach(function(basename) {
          var matches = destContents.match(
              new RegExp(wrapFilenameRegexStr(utils.preg_quote(basename)+"(\\?[0-9a-z]+)?"))
            ) !== null || destContents.match(new RegExp(wrapFilenameRegexStr(nameToNameSearch[basename]))) !== null;

          if (matches) {
            for (const nodeId of basenameToRealpaths[basename]) {
              fileDependencyGraph.setEdge(destNodeId, nodeId);
            }
          }
        });
      });

      // dag stores nodes as "arbitrary ID" => [realpaths]
      var dag = utils.mergeGraphCycles(fileDependencyGraph);
      var dagNodeHashesMap = {};

      graphlib.alg.topsort(dag).reverse().forEach(function (dagNodeId) {
        dag.successors(dagNodeId).forEach(function (succDagNodeId) {
          var succRenamedMap = {};

          dag.node(succDagNodeId).forEach(function (srcFile) {
            var fileName = fileDependencyGraph.node(srcFile),
                lastIndex  = fileName.lastIndexOf('.');
            succRenamedMap[srcFile] = formatter({
              hash: dagNodeHashesMap[succDagNodeId],
              name: fileName.slice(0, lastIndex),
              ext : fileName.slice(lastIndex + 1, fileName.length)
            });
          });

          dag.node(dagNodeId).forEach(function (dstFile) {
            var destContents = fs.readFileSync(dstFile, encoding);
            dag.node(succDagNodeId).forEach(function (srcFile) {
              var srcBaseName = fileDependencyGraph.node(srcFile);
              var renamed = succRenamedMap[srcFile];
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
            });
            fs.writeFileSync(dstFile, destContents, encoding);
          });
        });

        var subhashes = [];

        dag.node(dagNodeId).forEach(function (src) {
          subhashes.push(utils.md5File(src));
        });

        var md5 = dagNodeHashesMap[dagNodeId] =
          (subhashes.length === 1 ? subhashes[0] : utils.md5String(subhashes.join(''))).slice(0, 8);

        dag.node(dagNodeId).forEach(function (src) {
          // This file is only in dest, not in source.
          if (typeof fileDependencyGraph.node(src) === 'undefined') {
            return;
          }

          var fileName = fileDependencyGraph.node(src),
            lastIndex  = fileName.lastIndexOf('.'),
            renamed    = formatter({
              hash: md5,
              name: fileName.slice(0, lastIndex),
              ext : fileName.slice(lastIndex + 1, fileName.length)
            });

          // Renaming the file
          if (renameFiles) {
            fs.renameSync(src, path.resolve(path.dirname(src), renamed));
          }

          grunt.log.write(src + ' ').ok(renamed);
        });
      });
    });
  }
};
