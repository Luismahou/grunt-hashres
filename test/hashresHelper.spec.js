/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2013 Luismahou
 * Licensed under the MIT license.
 */

'use strict';

const vows   = require('vows'),
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

function getSourceNameToHashMap(files, root) {
  const result = {};

  files.forEach(function (f) {
    const basename = path.basename(f);
    const parts = basename.split('-');
    const origBaseName = parts.slice(1).join('-');
    const newPath = path.dirname(f) + path.sep + origBaseName;

    // hash
    result[path.relative(root, newPath)] = parts[0];
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
    'with recursive imports': {
      topic (grunt) {
        resetDirectoryFromSource('./temp/helper/recursive/', './temp/helper/recursive-temp');

        const runHashAndSubAndResetDir = function () {
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

          const result = getSourceNameToHashMap(grunt.file.expand('./temp/helper/recursive-temp/*.js'), './temp/helper/recursive-temp');
          resetDirectoryFromSource('./temp/helper/recursive/', './temp/helper/recursive-temp');

          return result;
        };

        const origHashes = runHashAndSubAndResetDir();
        this.callback(runHashAndSubAndResetDir, origHashes);
      },
      'when root file changes': function (runHashAndSubAndResetDir, origHashes) {
        changeJsFile('./temp/helper/recursive-temp/first.js');
        const firstFileChangedHashes = runHashAndSubAndResetDir();

        assert(origHashes['first.js'] !== firstFileChangedHashes['first.js']);
        assert(origHashes['second.js'] === firstFileChangedHashes['second.js']);
        assert(origHashes['second2.js'] === firstFileChangedHashes['second2.js']);
        assert(origHashes['second3.js'] === firstFileChangedHashes['second3.js']);
        assert(origHashes['third.js'] === firstFileChangedHashes['third.js']);
        assert(origHashes['singleton.js'] === firstFileChangedHashes['singleton.js']);
      },
      'when middle file changes (cycle)': function (runHashAndSubAndResetDir, origHashes) {
        changeJsFile('./temp/helper/recursive-temp/second.js');
        const secondFileChangedHashes = runHashAndSubAndResetDir();

        assert(origHashes['first.js'] !== secondFileChangedHashes['first.js']);
        assert(origHashes['second.js'] !== secondFileChangedHashes['second.js']);
        assert(origHashes['second2.js'] !== secondFileChangedHashes['second2.js']);
        assert(origHashes['second3.js'] !== secondFileChangedHashes['second3.js']);
        assert(origHashes['third.js'] === secondFileChangedHashes['third.js']);
        assert(origHashes['singleton.js'] === secondFileChangedHashes['singleton.js']);
      },
      'when leaf file changes': function (runHashAndSubAndResetDir, origHashes) {
        changeJsFile('./temp/helper/recursive-temp/third.js');
        const thirdFileChangedHashes = runHashAndSubAndResetDir();

        assert(origHashes['first.js'] !== thirdFileChangedHashes['first.js']);
        assert(origHashes['second.js'] !== thirdFileChangedHashes['second.js']);
        assert(origHashes['second2.js'] !== thirdFileChangedHashes['second2.js']);
        assert(origHashes['second3.js'] !== thirdFileChangedHashes['second3.js']);
        assert(origHashes['third.js'] !== thirdFileChangedHashes['third.js']);
        assert(origHashes['singleton.js'] === thirdFileChangedHashes['singleton.js']);
      },
    },
    'when two src files have the same basename': {
      topic (grunt) {
        resetDirectoryFromSource('./temp/helper/same-basename/', './temp/helper/same-basename-temp/');

        const runHashAndSub = function () {
          helper.hashAndSub(
            grunt, {
              files: [{
                src : grunt.file.expand('./temp/helper/same-basename-temp/**/*.js'),
                dest: grunt.file.expand('./temp/helper/same-basename-temp/**/*.js'),
              }],
              fileNameFormat: '${hash}-${name}.${ext}',
              encoding      : 'utf8',
              renameFiles   : true,
            });

          return getSourceNameToHashMap(grunt.file.expand('./temp/helper/same-basename-temp/**/*.js'), './temp/helper/same-basename-temp');
        };

        const origHashes = runHashAndSub();
        this.callback(runHashAndSub, origHashes);
      },
      'when script-a.js changes': function (runHashAndSub, origHashes) {
        resetDirectoryFromSource('./temp/helper/same-basename/', './temp/helper/same-basename-temp/');
        changeJsFile('./temp/helper/same-basename-temp/script-a.js');
        const changedHashes = runHashAndSub();

        assert(origHashes['script-a.js'] !== changedHashes['script-a.js']);
        assert(origHashes['script-b.js'] === changedHashes['script-b.js']);
        assert(origHashes['a/service.js'] === changedHashes['a/service.js']);
        assert(origHashes['b/service.js'] === changedHashes['b/service.js']);
      },
      'when a/service.js changes': function (runHashAndSub, origHashes) {
        resetDirectoryFromSource('./temp/helper/same-basename/', './temp/helper/same-basename-temp/');
        changeJsFile('./temp/helper/same-basename-temp/a/service.js');
        const changedHashes = runHashAndSub();

        assert(origHashes['script-a.js'] !== changedHashes['script-a.js']);
        assert(origHashes['a/service.js'] !== changedHashes['a/service.js']);
        // We're not checking that script-b and b/service.js remain the same to allow naive solutions
        // such as considering all the files with the same basename together.
        // However, the hash in script-b.js must be correct.
        const scriptBContents = fs.readFileSync(grunt.file.expand('./temp/helper/same-basename-temp/*script-b.js')[0], 'utf8');
        assert(scriptBContents.indexOf(changedHashes['b/service.js']) !== -1);
      },
      'when b/service.js changes': function (runHashAndSub, origHashes) {
        resetDirectoryFromSource('./temp/helper/same-basename/', './temp/helper/same-basename-temp/');
        changeJsFile('./temp/helper/same-basename-temp/b/service.js');
        const changedHashes = runHashAndSub();

        assert(origHashes['script-b.js'] !== changedHashes['script-b.js']);
        assert(origHashes['b/service.js'] !== changedHashes['b/service.js']);

        const scriptAContents = fs.readFileSync(grunt.file.expand('./temp/helper/same-basename-temp/*script-a.js')[0], 'utf8');
        assert(scriptAContents.indexOf(changedHashes['a/service.js']) !== -1);
      },
    },
    'when two dest files have the same basename': function (grunt) {
      resetDirectoryFromSource('./temp/helper/same-basename-dest/', './temp/helper/same-basename-dest-temp/');
      helper.hashAndSub(
        grunt, {
          files: [{
            src : grunt.file.expand('./temp/helper/same-basename-dest-temp/src/*.*'),
            dest: grunt.file.expand('./temp/helper/same-basename-dest-temp/dest/**/*.*'),
          }],
          fileNameFormat: '${hash}-${name}.${ext}',
          encoding      : 'utf8',
          renameFiles   : true,
        });
      assert(fs.existsSync('./temp/helper/same-basename-dest-temp/src/5a7a5b61-myscripts1.js'));
      assert(fs.existsSync('./temp/helper/same-basename-dest-temp/src/3b97b071-mystyles1.css'));
      const htmlA = fs.readFileSync('./temp/helper/same-basename-dest-temp/dest/a/index.html', 'utf8');
      assert(htmlA.indexOf('5a7a5b61-myscripts1.js') !== -1);

      const htmlB = fs.readFileSync('./temp/helper/same-basename-dest-temp/dest/b/index.html', 'utf8');
      assert(htmlB.indexOf('5a7a5b61-myscripts1.js') !== -1);
      assert(htmlB.indexOf('3b97b071-mystyles1.css') !== -1);
    },
  },
}).export(module);