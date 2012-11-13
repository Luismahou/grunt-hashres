/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
 * Licensed under the MIT license.
 */

var vows   = require('vows'),
    fs     = require('fs'),
    path   = require('path'),
    assert = require('assert'),
    grunt  = require('grunt'),
    helper = require('../tasks/hashresHelper'),
    wrench = require('wrench');

// Setting up the files for the tests
wrench.copyDirSyncRecursive('./test/fixtures/', './temp/', { preserve: false });

vows.describe('hashres').addBatch({
  'hashes resources': {
    topic: grunt,
    'for simple sample': function(grunt) {
      helper.hashAndSub(
        grunt, {
          files: ['./temp/simple/myscripts.js'],
          out: './temp/simple/index.html'
        });
      assert(path.existsSync('./temp/simple/5a7a5b61.myscripts.cache.js'));
      var html = fs.readFileSync('./temp/simple/index.html', 'utf8');
      assert(html.indexOf('5a7a5b61.myscripts.cache.js') !== -1);
    },
    'for sample with subfolders': function(grunt) {
      helper.hashAndSub(
        grunt, {
          files: [
            './temp/subfolders/scripts/*.js',
            './temp/subfolders/styles/mystyles1.css',
            './temp/subfolders/styles/mystyles2.css'],
          out: './temp/subfolders/index.html',
          fileNameFormat: '${hash}-${name}.${ext}'
        });
      assert(path.existsSync('./temp/subfolders/scripts/5a7a5b61-myscripts1.js'));
      assert(path.existsSync('./temp/subfolders/scripts/5a7a5b61-myscripts2.js'));
      assert(path.existsSync('./temp/subfolders/styles/3b97b071-mystyles1.css'));
      assert(path.existsSync('./temp/subfolders/styles/3b97b071-mystyles2.css'));
      var html = fs.readFileSync('./temp/subfolders/index.html', 'utf8');
      assert(html.indexOf('scripts/5a7a5b61-myscripts1.js') !== -1);
      assert(html.indexOf('scripts/5a7a5b61-myscripts2.js') !== -1);
      assert(html.indexOf('styles/3b97b071-mystyles1.css') !== -1);
      assert(html.indexOf('styles/3b97b071-mystyles2.css') !== -1);
    }
  }
}).export(module);