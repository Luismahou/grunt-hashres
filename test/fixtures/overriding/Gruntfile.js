/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2013 luismahou
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    hashres: {
      firstVersion: {
        src : ['js-v1/*.js'],
        dest: ['*.html']
      },
      secondVersion: {
        src : ['js-v2/*.js'],
        dest: ['*.html']
      }
    }
  });

  grunt.loadTasks('../../../tasks');

};
