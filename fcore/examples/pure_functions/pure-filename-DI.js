/**
 * Example using Dependency Injection. Contrast this with 'impure-filename.js' in .impure/
 */

const path = require("path"); // external dependency

//* PURE! using dependency injection:
function getFilenameWithDI(filepath, pathDep) {
  return pathDep.basename(filepath);
}

module.exports = {
  // getFilename,
  getFilenameWithDI,
  _purityTests: () => [
    () => {
      getFilenameWithDI("/foo/bar/hello.txt", path);
      return getFilenameWithDI;
    },
  ],
};