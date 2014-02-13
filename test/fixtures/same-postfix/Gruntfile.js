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
        src : ['*/*.js', '*/*.css'],
        dest: ['*.html']
      },
    }
  });

  grunt.loadTasks('../../../tasks');

};
