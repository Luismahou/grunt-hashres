## grunt-hashres has been updated to Grunt 0.4. if you're still using Grunt 0.3.x go to [old version documentation](https://github.com/Luismahou/grunt-hashres/blob/master/grunt-0.3-README.md)

# grunt-hashres

Hashes your js and css files and rename the ```<script>``` and ```<link>``` declarations that refer to them in your html/php/etc files.

## Getting Started
Install this grunt plugin next to your project's [Gruntfile.js][getting_started] with: `npm install grunt-hashres`

Then add this line to your project's `grunt.js` gruntfile:

```js
grunt.loadNpmTasks('grunt-hashres');
```

[grunt]: http://gruntjs.com/
[getting_started]: https://github.com/gruntjs/grunt/blob/master/docs/getting_started.md

## Documentation
Add the following to your ```Gruntfile.js``` file, inside the ```initConfig``` function:

```js
hashres: {
  // Global options
  options: {
    // Optional. Encoding used to read/write files. Default value 'utf8'
    encoding: 'utf8',
    // Optional. Format used to name the files specified in 'files' property.
    // Default value: '${hash}.${name}.cache.${ext}'
    fileNameFormat: '${hash}.${name}.cache.${ext}',
    // Optional. Should files be renamed or only alter the references to the files
    // Use it with '${name}.${ext}?${hash} to get perfect caching without renaming your files
    // Default value: true
    renameFiles: true
  },
  // hashres is a multitask. Here 'prod' is the name of the subtask. You can have as many as you want.
  prod: {
    // Specific options, override the global ones
    options: {
      // You can override encoding, fileNameFormat or renameFiles
    },
    // Files to hash
    src: [
      // WARNING: These files will be renamed!
      'dist/prod/scripts/my-compressed-and-minified-scripts.js',
      'dist/prod/styles/my-compressed-and-minified-styles.css'],
    // File that refers to above files and needs to be updated with the hashed name
    dest: 'dist/prod/home.php',
  }
}
```

The way this task works follows my workflow: I only hash the .js and .css files of my production release files,
which are first both uglified and minified.
If you want to hash a different set of files for a different environment,
simply add another subtask under ```hashres```.

### Heads up:
If you have upgraded from Grunt 0.3 version: 'files' and 'out' config properties have been replaced by 'src' and 'dest'

### Properties
* ```src```: A single file expression or an array of file expressions.
Something like ```myscripts/*.js``` would be valid.
* ```dest```: The file expression(s) that refer to the hashed files and that will be updated with the new names.
You can update more than one file specifying an array of output files: ```[out/fileOne.html, out/fileTwo.html]```
* ```encoding```: Encoding used to read and write files. Using ```utf8``` by default.
* ```fileNameFormat```: The files specified in property ```files``` will be renamed
according to the pattern specified in this property. The following variables are allowed:
  * ```${hash}```: the first 8 digits of the md5 of the file.
  * ```${name}```: the original name of the file.
  * ```${ext}```: the original extension of the file.
* ```renameFiles```: Rename the files or leave them in place and only alter the references to them in ```out```. Defaults to ```true```

## Status
[![Build Status](https://api.travis-ci.org/Luismahou/grunt-hashres.png)](https://travis-ci.org/Luismahou/grunt-hashres)

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History
* 17/11/14 - 0.3.4: Bugfix [#18](https://github.com/Luismahou/grunt-hashres/pull/18): Fixed special character test that doesn't work on windows.
* 07/11/13 - 0.3.3: Bugfix [#16](https://github.com/Luismahou/grunt-hashres/pull/16): Renaming files with special characters. Thanks to [crodas](https://github.com/crodas).
* 14/05/13 - 0.3.2: Bugfix [#8](https://github.com/Luismahou/grunt-hashres/pull/8): Replace all ocurrences. Thanks to [kleinsch](https://github.com/kleinsch).
* 20/02/13 - 0.3.0: Update to Grunt 0.4. **Check out the documentation because some configuration properties have changed.**
* 19/11/12 - 0.2.1: Optional File Renaming. Thanks to [raphaeleidus](https://github.com/raphaeleidus).
* 14/11/12 - 0.1.5: Feature request [#1](https://github.com/Luismahou/grunt-hashres/issues/1): ```fileNameFormat``` property added.
* 02/11/12 - 0.1.3: First working release.

## License
Copyright (c) 2013 Luismahou
Licensed under the MIT license.


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/Luismahou/grunt-hashres/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

