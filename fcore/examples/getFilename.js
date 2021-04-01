const path = require("path"); // external dependency

function getFilename(filepath) {
  return path.basename(filepath); // impure call, will FAIL purity test
}

function getFilenameWithDI(filepath, pathDep) {
  return pathDep.basename(filepath); // dependency injection will PASS purity test
}

module.exports = {
  getFilename,
  getFilenameWithDI,
  _purityTests: () => [
    () => {
      getFilename("/foo/bar/hello.txt");
      return getFilename;
    },
    () => {
      getFilenameWithDI("/foo/bar/hello.txt", path);
      return getFilenameWithDI;
    }
  ]
};
