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