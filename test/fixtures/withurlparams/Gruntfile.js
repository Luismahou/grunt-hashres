/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2015 Darrel Herbst
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    hashres: {
      withUrlParams: {
        src : ['myscripts.js', 'test.js'],
        dest: ['*.html']
      }
    }
  });

  grunt.loadTasks('../../../tasks');

};
