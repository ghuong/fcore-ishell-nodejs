/**
 * This file starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests fail
 */

/**
 * Example of an IMPURE function calling an external dependency
 */

const path = require("path"); // an external dependency

//! IMPURE: relies on external dependency 'path'!
// function getFilename(filepath) {
//   return path.basename(filepath); // impure call, will FAIL purity test
// }

const getFilename = (filepath) => path.basename(filepath);

module.exports = {
  getFilename,
  _puretests: () => [
    () => {
      getFilename("/foo/bar/hello.txt");
      return getFilename;
    },
  ],
};
