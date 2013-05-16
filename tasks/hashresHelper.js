/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
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
      algorithm        = options.algorithm,
      size             = options.size,
      fileNameFormat   = options.fileNameFormat,
      renameFiles      = options.renameFiles,
      nameToHashedName = {},
      formatter        = null;

  grunt.log.debug('files: ' + options.files);
  grunt.log.debug('Using encoding ' + encoding);
  grunt.log.debug('Using fileNameFormat ' + fileNameFormat);
  grunt.log.debug(renameFiles ? 'Renaming files' : 'Not renaming files');

  formatter = utils.compileFormat(fileNameFormat);

  if (options.files) {
    options.files.forEach(function(f) {
      f.src.forEach(function(src) {
        var
            hash      = utils.hash(src, algorithm, encoding),
            size      = options.size || hash.length,
            fileName  = path.basename(src),
            lastIndex = fileName.lastIndexOf('.'),
            renamed   = formatter({
              hash: hash.slice(0, size),
              name: fileName.slice(0, lastIndex),
              ext : fileName.slice(lastIndex + 1, fileName.length) });

        // Mapping the original name with hashed one for later use.
        nameToHashedName[fileName] = renamed;

        // Renaming the file
        if (renameFiles) {
          fs.renameSync(src, path.resolve(path.dirname(src), renamed));
        }
        grunt.log.write(src + ' ').ok(renamed);
      });

      // Substituting references to the given files with the hashed ones.
      if (f.dest) {
        grunt.file.expand(f.dest).forEach(function(f) {
          var destContents = fs.readFileSync(f, encoding);
          for (var name in nameToHashedName) {
            grunt.log.debug('Substituting ' + name + ' by ' + nameToHashedName[name]);
            destContents = destContents.replace(new RegExp(name, "g"), nameToHashedName[name]);
          }
          grunt.log.debug('Saving the updated contents of the outination file');
          fs.writeFileSync(f, destContents, encoding);
        });
      }
    });
  }
};
