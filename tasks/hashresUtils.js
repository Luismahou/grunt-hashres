var crypto = require('crypto'),
    fs     = require('fs');

// Generates a function for the given format
// Valid format variables: ${hash}, ${name} and ${ext}
exports.compileFormat = function(format) {
  return function(options) {
    var output = format.replace(/\$\{hash\}/g, options.hash);
    output = output.replace(/\$\{name\}/g, options.name);
    output = output.replace(/\$\{ext\}/g, options.ext);
    return output;
  };
};

// Generates the md5 for the given file
exports.md5 = function(filepath) {
  var hash = crypto.createHash('md5');
  hash.update(fs.readFileSync(String(filepath), 'utf8'));
  return hash.digest('hex');
};
