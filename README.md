# grunt-hashres

Hashes your js and css files and rename the ```<script>``` and ```<link>``` declarations that refer to them in your html/php/etc files.

## Getting Started
Install this grunt plugin next to your project's [grunt.js gruntfile][getting_started] with: `npm install grunt-hashres`

Then add this line to your project's `grunt.js` gruntfile:

```javascript
grunt.loadNpmTasks('grunt-hashres');
```

[grunt]: http://gruntjs.com/
[getting_started]: https://github.com/gruntjs/grunt/blob/master/docs/getting_started.md

## Documentation
Add the following to your ```grunt.js``` file, inside the ```initConfig``` function:
```javascript
hashres: {
  // hashres is a multitask. Here 'prod' is the name of the subtask. You can have as many as you want.
  prod: {
    // Files to hash
    files: [
      // WARNING: These files will be renamed!
      'dist/prod/scripts/my-compressed-and-minified-scripts.js',
      'dist/prod/styles/my-compressed-and-minified-styles.css'],
    // File that refers to above files and needs to be updated with the hashed name
    out: 'dist/prod/home.php',
    // Optional. Encoding used to read/write files. Default value 'utf8'
    encoding: 'utf8',
    // Optional. Format used to name the files specified in 'files' property. 
    // Default value: '${hash}.${name}.cache.${ext}'
    fileNameFormat: '${hash}.${name}.cache.${ext}'
  }
}
```
The way this task works follows my workflow: I only hash the .js and .css files of my production release files, 
which are first both uglified and minified.
If you want to hash a different set of files for a different environment, 
simply add another subtask under ```hashres```.

### Properties
* ```files```: A single file expression or an array of file expressions. 
Something like ```myscripts/*.js``` would be valid.
* ```out```: The file expression(s) that refer to the hashed files and that will be updated with the new names. 
You can update more than one file specifying an array of output files: ```[out/fileOne.html, out/fileTwo.html]```
* ```encoding```: Encoding used to read and write files. Using ```utf8``` by default.
* ```fileNameFormat```: The files specified in property ```files``` will be renamed 
according to the pattern specified in this property. The following variables are allowed:
  * ```${hash}```: the first 8 digits of the md5 of the file.
  * ```${name}```: the original name of the file.
  * ```${ext}```: the original extension of the file.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. 
Add unit tests for any new or changed functionality. Lint and test your code using [grunt][grunt].

## Release History
* 0.1.3: First working release.

## License
Copyright (c) 2012 Luismahou  
Licensed under the MIT license.
