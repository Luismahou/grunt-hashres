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
    }
  }
}).export(module);