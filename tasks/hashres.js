/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

  // Loading necessary modules
  var fs     = require('fs'),
      path   = require('path'),
      crypto = require('crypto'),
      helper = require('./hashresHelper');

  grunt.registerMultiTask(
      'hashres',
      'Hashes your resources and updates the files that refer to them',
      function() {
    // Required properties: 'files' and 'out'
    this.requiresConfig(this.name + '.' + this.target + '.files');
    this.requiresConfig(this.name + '.' + this.target + '.out');
    helper.hashAndSub(grunt, {
      files         : this.data.files,
      out           : this.data.out,
      encoding      : this.data.encoding,
      fileNameFormat: this.data.fileNameFormat,
      renameFiles   : this.data.renameFiles
    });
  });
};
