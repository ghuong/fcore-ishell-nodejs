const fs = require("fs");
const path = require("path");

const isolateFunctions = require("../fcore/isolateFunctions");

/**
 * Re-write all files' source code so that their functions run in isolated sandboxes.
 * For more, see: https://glebbahmutov.com/blog/test-if-a-function-is-pure-revisited/
 * @param {Array<String>} files list of filepaths relative to fromDir
 * @param {String} fromDir directory holding input files
 * @param {String} toDir directory to write output files
 * @param {Array<Array<String>>} depsPerFile list of dependencies for each file
 */
function rewriteSrcFiles(files, fromDir, toDir, depsPerFile) {
  files.forEach((file, iFile) => {
    const inputFile = path.join(fromDir, file);
    const outputFile = path.join(toDir, file);
    rewriteSrcFile(inputFile, outputFile, depsPerFile[iFile]);
  });
}

/**
 * Re-write file's source code so that its functions run in isolated sandboxes.
 * @param {String} inputFile input filepath
 * @param {String} outputFile output filepath
 * @param {Array<String>} dependencies names of dependencies to inject into sandbox
 */
function rewriteSrcFile(inputFile, outputFile, dependencies) {
  const sourceCode = fs.readFileSync(inputFile, "utf8");
  const rewrittenSourceCode = isolateFunctions(sourceCode, dependencies);

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, rewrittenSourceCode, "utf8");
}

module.exports = rewriteSrcFiles;
