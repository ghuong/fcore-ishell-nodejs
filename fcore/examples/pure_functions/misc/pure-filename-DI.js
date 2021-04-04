
/**
 * Example using Dependency Injection. Contrast this with 'impure-filename.js' in .impure/
 */

const path = require("path"); // external dependency

//* PURE! using dependency injection:
function getFilenameWithDI(filepath, pathDep) {
  return pathDep.basename(filepath);
}

const puretest = require("puretest");

module.exports = {
  // getFilename,
  getFilenameWithDI,
  _puretests: 
    puretest(getFilenameWithDI, "/foo/bar/hello.txt", path)
};
