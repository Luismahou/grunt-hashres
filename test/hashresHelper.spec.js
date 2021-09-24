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
    path   = require('path'),
    assert = require('assert'),
    grunt  = require('grunt'),
    helper = require('../tasks/hashresHelper'),
    wrench = require('wrench');

function resetDirectoryFromSource(sourceDir, targetDir) {
  wrench.rmdirSyncRecursive(targetDir, function () {});
  grunt.file.mkdir(targetDir);
  wrench.copyDirSyncRecursive(sourceDir, targetDir, { preserve: false });
}

function getSourceNameToHashMap(files) {
  var result = {};

  files.forEach(function (f) {
    var basename = path.basename(f);
    var parts = basename.split('-');
    var origBaseName = parts.slice(1).join('-');
    // hash
    result[origBaseName] = parts[0];
  });

  return result;
}

function changeJsFile(file) {
  var destContents = fs.readFileSync(file, 'utf-8');
  destContents += "\n//Something changed\n";
  fs.writeFileSync(file, destContents, 'utf-8');
}

// Setting up the files for the tests
resetDirectoryFromSource('./test/fixtures/', './temp/helper/');

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
    },
    'for recursive imports': function(grunt) {
      resetDirectoryFromSource('./temp/helper/recursive/', './temp/helper/recursive-temp');

      var runHashAndSubAndResetDir = function () {
        helper.hashAndSub(
          grunt, {
            files: [{
              src : grunt.file.expand('./temp/helper/recursive-temp/*.js'),
              dest: grunt.file.expand('./temp/helper/recursive-temp/*.js'),
            }],
            fileNameFormat: '${hash}-${name}.${ext}',
            encoding      : 'utf8',
            renameFiles   : true,
          });

          var result = getSourceNameToHashMap(grunt.file.expand('./temp/helper/recursive-temp/*.js'));
          resetDirectoryFromSource('./temp/helper/recursive/', './temp/helper/recursive-temp');

          return result;
      };

      var origHashes = runHashAndSubAndResetDir();

      changeJsFile('./temp/helper/recursive-temp/first.js');
      var firstFileChanged = runHashAndSubAndResetDir();

      assert(origHashes['first.js'] !== firstFileChanged['first.js']);
      assert(origHashes['second.js'] === firstFileChanged['second.js']);
      assert(origHashes['second2.js'] === firstFileChanged['second2.js']);
      assert(origHashes['second3.js'] === firstFileChanged['second3.js']);
      assert(origHashes['third.js'] === firstFileChanged['third.js']);
      assert(origHashes['singleton.js'] === firstFileChanged['singleton.js']);

      changeJsFile('./temp/helper/recursive-temp/second.js');
      var secondFileChangedHashes = runHashAndSubAndResetDir();

      assert(origHashes['first.js'] !== secondFileChangedHashes['first.js']);
      assert(origHashes['second.js'] !== secondFileChangedHashes['second.js']);
      assert(origHashes['second2.js'] !== secondFileChangedHashes['second2.js']);
      assert(origHashes['second3.js'] !== secondFileChangedHashes['second3.js']);
      assert(origHashes['third.js'] === secondFileChangedHashes['third.js']);
      assert(origHashes['singleton.js'] === firstFileChanged['singleton.js']);

      changeJsFile('./temp/helper/recursive-temp/third.js');
      var thirdFileChanged = runHashAndSubAndResetDir();

      assert(origHashes['first.js'] !== thirdFileChanged['first.js']);
      assert(origHashes['second.js'] !== thirdFileChanged['second.js']);
      assert(origHashes['second2.js'] !== thirdFileChanged['second2.js']);
      assert(origHashes['second3.js'] !== thirdFileChanged['second3.js']);
      assert(origHashes['third.js'] !== thirdFileChanged['third.js']);
      assert(origHashes['singleton.js'] === firstFileChanged['singleton.js']);
    },
  }
}).export(module);