/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2013 luismahou
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var helper = require('./hashresHelper');

  grunt.registerMultiTask('hashres', 'Your task description goes here.', function() {

    // Merging options with defaults
    var options = this.options({
      fileNameFormat: '${hash}.${name}.cache.${ext}',
      encoding      : 'utf8',
      renameFiles   : true
    });

    // Required properties: 'src' and 'dest'
    this.requiresConfig(this.name + '.' + this.target + '.src');
    this.requiresConfig(this.name + '.' + this.target + '.dest');
    helper.hashAndSub(grunt, {
      files: this.files,
      src           : options.src,
      dest          : options.dest,
      encoding      : options.encoding,
      fileNameFormat: options.fileNameFormat,
      renameFiles   : options.renameFiles
    });
  });

};
