/*
 * grunt-hashres
 * https://github.com/luismahou/grunt-hashres
 *
 * Copyright (c) 2012 Luismahou
 * Licensed under the MIT license.
 */

var vows   = require('vows'),
    assert = require('assert'),
    grunt  = require('grunt');

vows.describe('hashres').addBatch({
  'hashes resources': {
    topic: 'bla',
    'is bla': function(topic) {
      assert.equal(topic, 'bla');
    }
  }
}).export(module);