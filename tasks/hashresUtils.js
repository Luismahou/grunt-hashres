/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
 * Licensed under the MIT license.
 */

'use strict';

var crypto = require('crypto'),
    fs     = require('fs');

// Generates a function for the given format
// Valid format variables: ${hash}, ${name} and ${ext}
exports.compileFormat = function(format) {
  return function(options) {
    var output = format.replace(/\$\{hash\}/g, options.hash);
    output = output.replace(/\$\{name\}/g, options.name);
    output = output.replace(/\$\{ext\}/g, options.ext);
    return output;
  };
};

// Generates the hash for the given file
exports.hash = function(filepath, algorithm, encoding) {
  var hash = crypto.createHash(algorithm);
  hash.update(fs.readFileSync(String(filepath), encoding));
  return hash.digest('hex');
};
