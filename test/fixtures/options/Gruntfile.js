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
      options: {
        fileNameFormat: '${hash}.${ext}'
      },
      withCustomOptions: {
        options: {
          fileNameFormat: '${hash}-php.${ext}'
        },
        src : ['with-custom-options/*.js', 'with-custom-options/*.css'],
        dest: ['with-custom-options/*.html']
      },
      withDefaultOptions: {
        src : ['with-default-options/**/*.js', 'with-default-options/**/*.css'],
        dest: ['with-default-options/*.html']
      },
      withSpecialCharacters: {
        options: {
          fileNameFormat: '${name}.${ext}?${hash}',
          renameFiles   : false
        },
        src : ['with-special-characters/**/*.js', 'with-special-characters/**/*.css'],
        dest: ['with-special-characters/*.html']
      }
    }
  });

  grunt.loadTasks('../../../tasks');

};
