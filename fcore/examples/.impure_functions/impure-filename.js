/**
 * This file/dir starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests fail
 */

/**
 * Example of an IMPURE function calling an external dependency
 */

const path = require("path"); // an external dependency

//! IMPURE: relies on external dependency 'path'!
function getFilename(filepath) {
  return path.basename(filepath);
}

const puretest = require("puretest");

module.exports = {
  getFilename,
  _puretests: 
    puretest(getFilename, "/foo/bar/hello.txt")
};
