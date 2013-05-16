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
        fileNameFormat: '${hash}.${ext}',
        size: 8
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
      withSkipDestOptions: {
        src : ['with-skip-dest-options/**/*.js', 'with-skip-dest-options/**/*.css']
      }
    }
  });

  grunt.loadTasks('../../../tasks');

};
