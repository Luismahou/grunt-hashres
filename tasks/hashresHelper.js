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
    utils = require('./hashresUtils');

exports.hashAndSub = function(grunt, options) {

  var src              = options.src,
      dest             = options.dest,
      encoding         = options.encoding,
      fileNameFormat   = options.fileNameFormat,
      renameFiles      = options.renameFiles,
      nameToHashedName = {},
      nameToNameSearch = {},
      formatter        = null,
      searchFormatter  = null;

  grunt.log.debug('files: ' + options.files);
  grunt.log.debug('Using encoding ' + encoding);
  grunt.log.debug('Using fileNameFormat ' + fileNameFormat);
  grunt.log.debug(renameFiles ? 'Renaming files' : 'Not renaming files');

  formatter = utils.compileFormat(fileNameFormat);
  searchFormatter = utils.compileSearchFormat(fileNameFormat);

  if (options.files) {
    options.files.forEach(function(f) {
      f.src.forEach(function(src) {
        var md5        = utils.md5(src).slice(0, 8),
            fileName   = path.basename(src),
            lastIndex  = options.knownExtensions ? options.knownExtensions.concat('.').reduce(function(index, ext) {
              return index === -1 ? fileName.lastIndexOf(ext) : index;
            }, -1) : fileName.lastIndexOf('.'),
            renamed    = formatter({
              hash: md5,
              name: fileName.slice(0, lastIndex),
              ext : fileName.slice(lastIndex + 1, fileName.length)
            }),
            nameSearch = searchFormatter({
              hash: /[0-9a-f]{8}/,
              name: fileName.slice(0, lastIndex),
              ext: fileName.slice(lastIndex + 1, fileName.length)
            });

        // Mapping the original name with hashed one for later use.
        nameToHashedName[fileName] = renamed;
        nameToNameSearch[fileName] = nameSearch;

        // Renaming the file
        if (renameFiles) {
          fs.renameSync(src, path.resolve(path.dirname(src), renamed));
        }
        grunt.log.write(src + ' ').ok(renamed);
      });

      // sort by length 
      // It is very useful when we have bar.js and foo-bar.js 
      // Longest (most specific filename) will be replaced first so can't clash with subsequent partial matches
      // @crodas
      var files = [];
      for (var name in nameToHashedName) {
        files.push([name, nameToHashedName[name]]);
      }
      files.sort(function(a, b) {
        return b[0].length - a[0].length;
      });

      // reverse sort by length
      // It is very useful when updating existing hashes like foo.12345678.js and foo.12345678.js.map
      // Longest (most specific filename) will be replaced last so can't be overridden by partial matches
      // @cyberthom
      var reversedFiles = files.slice(0).reverse();


      // Substituting references to the given files with the hashed ones.
      grunt.file.expand(f.dest).forEach(function(f) {
        var destContents = fs.readFileSync(f, encoding);
        files.forEach(function(value) {
          grunt.log.debug('Substituting ' + value[0] + ' by ' + value[1])
          destContents = destContents.replace(new RegExp(utils.preg_quote(value[0])+"(\\?[0-9a-z]+)?", "g"), value[1]);
        });
        reversedFiles.forEach(function(value) {
          grunt.log.debug('Substituting ' + nameToNameSearch[value[0]] + ' by ' + value[1])
          destContents = destContents.replace(new RegExp(nameToNameSearch[value[0]], "g"), value[1]);
        });
        grunt.log.debug('Saving the updated contents of the outination file');
        fs.writeFileSync(f, destContents, encoding);
      });
    });
  }
};
