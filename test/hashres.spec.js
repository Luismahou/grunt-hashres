/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
 * Licensed under the MIT license.
 */

'use strict';

var vows         = require('vows'),
    fs           = require('fs'),
    childProcess = require('child_process'),
    assert       = require('assert'),
    grunt        = require('grunt'),
    wrench       = require('wrench');

// Setting up the files for the tests
grunt.file.mkdir('./temp/hashres/');
wrench.copyDirSyncRecursive('./test/fixtures/', './temp/hashres/', { preserve: false });

var runCommand = function(command, options, callback) {
  var process = childProcess.exec(
      command, options, function (error, stdout, stderr) {
    if (error) {
      console.log(error.stack);
      console.log('Error code: '+error.code);
      console.log('Signal received: '+error.signal);
    }
    console.log('Child Process STDOUT: '+stdout);
    console.log('Child Process STDERR: '+stderr);
  });
  process.on('exit', function(code) {
    console.log('process finished: ' + code);
    callback();
    console.log('callback finished');
  });
};

var pathWithCustomOptions  = 'temp/hashres/options/with-custom-options';
var pathWithDefaultOptions = 'temp/hashres/options/with-default-options';

vows.describe('hashres').addBatch({
  'with custom options': {
    topic: function() {
      runCommand(
        'grunt hashres:withCustomOptions',
        { cwd: pathWithCustomOptions },
        this.callback);
    },
    'hashes resources': function() {
      // Files have been renamed
      assert(grunt.file.exists(pathWithCustomOptions + '/5a7a5b61-php.js'));
      assert(grunt.file.exists(pathWithCustomOptions + '/3b97b071-php.css'));
      // html has been updated
      var html = grunt.file.read(pathWithCustomOptions + '/index.html');
      assert(html.indexOf('5a7a5b61-php.js') !== -1);
      assert(html.indexOf('3b97b071-php.css') !== -1);
    },
  },
  'with default options': {
    topic: function() {
      runCommand(
        'grunt hashres:withDefaultOptions',
        { cwd: pathWithDefaultOptions },
        this.callback);
    },
    'hashes resources': function() {
      // Files have been renamed
      assert(grunt.file.exists(pathWithDefaultOptions + '/scripts/5a7a5b61.js'));
      assert(grunt.file.exists(pathWithDefaultOptions + '/styles/3b97b071.css'));
      // index.html has been updated
      var html1 = grunt.file.read(pathWithDefaultOptions + '/index.html');
      assert(html1.indexOf('scripts/5a7a5b61.js') !== -1);
      assert(html1.indexOf('styles/3b97b071.css') !== -1);
      var html2 = grunt.file.read(pathWithDefaultOptions + '/index2.html');
      assert(html2.indexOf('scripts/5a7a5b61.js') !== -1);
      assert(html2.indexOf('styles/3b97b071.css') !== -1);
    }
  }
}).export(module);