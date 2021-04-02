const fs = require("fs");
const path = require("path");
const falafel = require("falafel");
const mkdirp = require("mkdirp");
const rewrite = require("./rewrite");
const config = require("./config");

/**
 * Get all relative filepaths in given directory, recursively,
 * but ignoring files and directories starting with dot: .
 * @param {String} directoryPath directory path to look in
 * @returns {Array<String>} filepaths relative to given directoryPath
 */
function getRelativeFilepathsInDir(directoryPath) {
  const files = [];

  /**
   * Recursive helper
   * @param {String} baseDirectoryPath path of base directory
   * @param {String} subdirectoryPath relative path of sub-directory
   */
  function recurseIn(baseDirectoryPath, subdirectoryPath = "") {
    const currentDirectoryPath = subdirectoryPath
      ? path.join(baseDirectoryPath, subdirectoryPath)
      : baseDirectoryPath;

    fs.readdirSync(currentDirectoryPath).forEach((file) => {
      if (file.startsWith(".")) return; // ignore files starting with .

      const absoluteFilePath = path.join(currentDirectoryPath, file);
      const relativeFilePath = path.join(subdirectoryPath, file);
      if (fs.statSync(absoluteFilePath).isDirectory()) {
        recurseIn(baseDirectoryPath, relativeFilePath); // go deeper into this directory
      } else {
        files.push(relativeFilePath);
      }
    });
  }

  recurseIn(directoryPath);
  return files;
}

/**
 * Remove given directory
 */
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

/**
 * Clear require cache to force reload of modules
 */
function clearRequireCache() {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
}

/**
 * Rewrite source files from one directory to another
 * @param {Array<String>} files list of filepaths relative to fromDir
 * @param {String} fromDir directory holding input files
 * @param {String} toDir directory to write output files
 * @param {Array<Array<String>>} pureFunctions each file has an entry in this list,
 *  and each entry, contains the
 * @returns list of absolute filepaths of all output files
 */
function rewriteAll(files, fromDir, toDir, pureFunctions = []) {
  return files.map((file, idx) => {
    const inputFile = path.join(fromDir, file);
    const outputFile = path.join(toDir, file);
    const dependenciesToInject =
      pureFunctions.length > 0 ? pureFunctions[idx] : [];
    rewrite(inputFile, outputFile, dependenciesToInject);
    return outputFile;
  });
}

function copyFile(file, fromDir, toDir) {
  mkdirp.sync(toDir);
  fs.copyFileSync(path.join(fromDir, file), path.join(toDir, file));
}

/**
 * Given a filepath to a source file, find all statements of the form:
 * `X = require(Y)`, and return a list of all the X's by their name.
 * TODO: currently does not support destructuring syntax, i.e. `{ X } = require(Y)`
 * @param {Array<String>} filepath source file to read
 */
function findRequiredDependenciesInSourceFile(filepath) {
  const dependencies = [];

  const source = fs.readFileSync(filepath, "utf8");
  falafel(source, function (node) {
    if (node.type === "VariableDeclaration") {
      node.declarations.forEach((declaration) => {
        if (
          declaration.init?.object?.type === "CallExpression" &&
          declaration.init?.object?.callee?.name === "require" &&
          declaration.id.name !== config.puretestsHelper
        ) {
          dependencies.push(declaration.id.name);
        }
      });
      // console.log("id:", node.declarations[0].id.name);
      // console.log("init:", node.declarations[0].init);
    }
  });

  return dependencies;
}

/**
 * Runs the "purity tests" defined within a given "fcore" module. See docs for explanation.
 * @param {String} fcoreModuleName name of fcore module
 * @returns an object { pureFunctions, errors }, where:
 *  - pure : list of names of pure functions declared in the module
 *  - impure : list of names of impure functions declared in the module
 *  - errors : list of errors thrown when each impure function was run in isolated VM sandbox
 */
function runPuretests(fcoreModuleName) {
  const fcoreModule = require(fcoreModuleName);
  if (!fcoreModule._puretests || fcoreModule._puretests.constructor !== Object)
    throw new Error(`Missing \`${config.puretests}\` in \`${fcoreModuleName}\`.\nSee docs.`);

  return fcoreModule._puretests._run();
}

/**
 * reference error
 * @param {ReferenceError} referenceError 
 * @returns name of the reference which is not defined
 */
function getReferenceFromError(referenceError) {
  if (referenceError.name !== "ReferenceError")
    throw new TypeError("argument must be a ReferenceError");

  const errMsg = referenceError.message;
  if (errMsg.includes("is not defined")) {
    return errMsg.split(" ")[0];
  }
}

module.exports = {
  getRelativeFilepathsInDir,
  removeDir,
  copyFile,
  rewriteAll,
  findRequiredDependenciesInSourceFile,
  clearRequireCache,
  runPuretests,
  getReferenceFromError,
};
