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
    const fileDependencies = depsPerFile.length > 0 ? depsPerFile[iFile] : [];
    rewriteSrcFile(inputFile, outputFile, fileDependencies);
  });
}

/**
 * Re-write file's source code so that its functions run in isolated sandboxes.
 * @param {String} inputFilename input filepath
 * @param {String} outputFilename output filepath
 * @param {Array<String>} dependencies names of dependencies to inject into sandbox
 */
function rewriteSrcFile(inputFilename, outputFilename, dependencies) {
  const sourceCode = fs.readFileSync(inputFilename, "utf8");
  const rewrittenSourceCode = isolateFunctions(sourceCode, dependencies);

  fs.mkdirSync(path.dirname(outputFilename), { recursive: true });
  fs.writeFileSync(outputFilename, rewrittenSourceCode, "utf8");
}

module.exports = rewriteSrcFiles;
