/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2013 Luismahou
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
      console.log('Error code: ' + error.code);
      console.log('Signal received: ' + error.signal);
    }
    console.log('Child Process STDOUT: ' + stdout);
    console.log('Child Process STDERR: ' + stderr);
  });
  process.on('exit', function(code) {
    console.log('process finished: ' + code);
    callback();
    console.log('callback finished');
  });
};

var pathWithCustomOptions     = 'temp/hashres/options/with-custom-options';
var pathWithDefaultOptions    = 'temp/hashres/options/with-default-options';
var pathSamePostFix           = 'temp/hashres/same-postfix';
var pathWithSpecialCharacters = 'temp/hashres/options/with-special-characters';
var pathOverridingHashedFiles = 'temp/hashres/overriding';

vows.describe('hashres').addBatch({
  'with custom options': {
    topic: function() {
      runCommand(
        '../../../../node_modules/grunt-cli/bin/./grunt hashres:withCustomOptions',
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
  'with default options with same postfix': {
    topic: function() {
      runCommand(
        '../../../node_modules/grunt-cli/bin/./grunt hashres:firstVersion',
        { cwd: pathSamePostFix },
        this.callback);
    },
    'hashes resources': function() {
      // Files have been renamed
      assert(grunt.file.exists(pathSamePostFix + '/scripts/21e6fab2.foobar.cache.js'));
      assert(grunt.file.exists(pathSamePostFix + '/scripts/8e99730f.bar.cache.js'));
      assert(grunt.file.exists(pathSamePostFix + '/styles/3b97b071.mobile.cache.css'));
      assert(grunt.file.exists(pathSamePostFix + '/styles/d4f950b1.foo-mobile.cache.css'));

      // index.html has been updated
      var html1 = grunt.file.read(pathSamePostFix + '/index.html');
      assert(html1.indexOf('scripts/21e6fab2.foobar.cache.js') !== -1);
      assert(html1.indexOf('scripts/8e99730f.bar.cache.js') !== -1);
      assert(html1.indexOf('styles/3b97b071.mobile.cache.css') !== -1);
      assert(html1.indexOf('styles/d4f950b1.foo-mobile.cache.css') !== -1);
    }
  },
  'with default options': {
    topic: function() {
      runCommand(
        '../../../../node_modules/grunt-cli/bin/./grunt hashres:withDefaultOptions',
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
  },
  'with special characters': {
    topic: function() {
      runCommand(
        '../../../../node_modules/grunt-cli/bin/./grunt hashres:withSpecialCharacters',
        { cwd: pathWithSpecialCharacters },
        this.callback);
    },
    'hashes resources': function() {
      // Files have been renamed
      assert(grunt.file.exists(pathWithSpecialCharacters + '/scripts/+3$3.js'));
      assert(grunt.file.exists(pathWithSpecialCharacters + '/styles/+1.css'));
      // index.html has been updated
      var html = grunt.file.read(pathWithSpecialCharacters + '/index.html');
      assert(html.indexOf('scripts/+3$3.js?5a7a5b61') !== -1);
      assert(html.indexOf('styles/+1.css?3b97b071') !== -1);
    }
  },
  'overriding hashed files': {
    topic: function() {
      runCommand(
        '../../../node_modules/grunt-cli/bin/./grunt hashres:firstVersion hashres:secondVersion',
        { cwd: pathOverridingHashedFiles },
        this.callback);
    },
    'hashes resources overriding references in second hashres execution': function() {
      // Both files have been renamed
      assert(grunt.file.exists(pathOverridingHashedFiles + '/js-v1/688d441c.script.cache.js'));
      assert(grunt.file.exists(pathOverridingHashedFiles + '/js-v2/cab5c571.script.cache.js'));
      // index.html has been updated with the second version
      var html = grunt.file.read(pathOverridingHashedFiles + '/index.html');
      assert(html.indexOf('js/cab5c571.script.cache.js') !== -1);
    }
  }
}).export(module);
