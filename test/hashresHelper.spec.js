/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2013 Luismahou
 * Licensed under the MIT license.
 */

'use strict';

var vows   = require('vows'),
    fs     = require('fs'),
    assert = require('assert'),
    grunt  = require('grunt'),
    helper = require('../tasks/hashresHelper'),
    wrench = require('wrench');

// Setting up the files for the tests
grunt.file.mkdir('./temp/helper/');
wrench.copyDirSyncRecursive('./test/fixtures/', './temp/helper/', { preserve: false });

vows.describe('hashresHelper').addBatch({
  'hashes resources': {
    topic: grunt,
    'for simple sample': function(grunt) {
      helper.hashAndSub(
        grunt, {
          files: [{
            src  : ['./temp/helper/simple/myscripts.js'],
            dest : './temp/helper/simple/index.html',
          }],
          fileNameFormat: '${hash}.${name}.cache.${ext}',
          encoding      : 'utf8',
          renameFiles   : true
        });
      assert(fs.existsSync('./temp/helper/simple/5a7a5b61.myscripts.cache.js'));
      var html = fs.readFileSync('./temp/helper/simple/index.html', 'utf8');
      assert(html.indexOf('5a7a5b61.myscripts.cache.js') !== -1);
    },
    'for sample with subfolders': function(grunt) {
      helper.hashAndSub(
        grunt, {
          files: [{
            src : grunt.file.expand([
              './temp/helper/subfolders/scripts/*.js',
              './temp/helper/subfolders/styles/mystyles1.css',
              './temp/helper/subfolders/styles/mystyles2.css']),
            dest: './temp/helper/subfolders/index.html'
          }],
          fileNameFormat: '${hash}-${name}.${ext}',
          encoding      : 'utf8',
          renameFiles   : true
        });
      assert(fs.existsSync('./temp/helper/subfolders/scripts/5a7a5b61-myscripts1.js'));
      assert(fs.existsSync('./temp/helper/subfolders/scripts/5a7a5b61-myscripts2.js'));
      assert(fs.existsSync('./temp/helper/subfolders/styles/3b97b071-mystyles1.css'));
      assert(fs.existsSync('./temp/helper/subfolders/styles/3b97b071-mystyles2.css'));
      var html = fs.readFileSync('./temp/helper/subfolders/index.html', 'utf8');
      assert(html.indexOf('scripts/5a7a5b61-myscripts1.js') !== -1);
      assert(html.indexOf('scripts/5a7a5b61-myscripts2.js') !== -1);
      assert(html.indexOf('styles/3b97b071-mystyles1.css') !== -1);
      assert(html.indexOf('styles/3b97b071-mystyles2.css') !== -1);
    }
  }
}).export(module);