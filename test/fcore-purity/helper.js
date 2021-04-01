const falafel = require("falafel");
const rewrite = require("./rewrite");
const fs = require("fs");
const path = require("path");

/**
 * Get all filenames in a directory recursively as an array of relative paths,
 * but ignore directories starting with `.`
 * @param {String} directoryPath directory path to look in
 * @returns an array of string file paths relative to directoryPath
 */
function getAllFilenames(directoryPath) {
  const files = [];

  function getAllFilenamesRecursively(baseDirPath, nestedDirPath = "") {
    const dirPath = nestedDirPath
      ? path.join(baseDirPath, nestedDirPath)
      : baseDirPath;

    fs.readdirSync(dirPath).forEach((file) => {
      if (file.startsWith(".")) return;

      const absoluteFilePath = path.join(dirPath, file);
      const relativeFilePath = path.join(nestedDirPath, file);
      if (fs.statSync(absoluteFilePath).isDirectory()) {
        getAllFilenamesRecursively(baseDirPath, relativeFilePath);
      } else {
        files.push(relativeFilePath);
      }
    });
  }

  getAllFilenamesRecursively(directoryPath);
  return files;
}

/**
 * Remove the .rewrites directory
 */
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

function clearRequireCache() {
  Object.keys(require.cache).forEach(function (key) {
    delete require.cache[key];
  });
}

/**
 * Rewrite fcore/ files to .rewrite/
 * @param {Array<String>} files list of relative file paths contained in fromDir
 * @param {String} fromDir directory holding input files
 * @param {String} toDir directory to write output files
 * @returns list of absolute paths of all output files
 */
function rewriteAll(files, fromDir, toDir, pureFunctions = []) {
  return files.map((file, idx) => {
    const inputFile = path.join(fromDir, file);
    const outputFile = path.join(toDir, file);
    rewrite(inputFile, outputFile, pureFunctions.length > 0 ? pureFunctions[idx] : []);
    return outputFile;
  });
}

/**
 * 
 * @param {Array<String>} file file path
 */
function getDependencies(file) {
  const dependencies = [];

  const source = fs.readFileSync(file, "utf8");
  falafel(source, function (node) {
    if (node.type === "VariableDeclaration") {
      node.declarations.forEach(dec => {
        if (dec.init?.object?.type === "CallExpression" && dec.init?.object?.callee?.name === "require") {
          dependencies.push(dec.id.name);
        }
      });
      // console.log("id:", node.declarations[0].id.name);
      // console.log("init:", node.declarations[0].init);
    }
  });

  return dependencies;
}

  /**
   * Runs the purity tests in a given fcore module
   * @param {String} file filename containing the fcore module
   * @returns a an object { pureFunctions, numImpure }, where:
   * pureFunctions : list of names of pure functions declared in the file
   * errors : list of errors thrown in tests
   */
  function runPurityTests(file) {
    const fcoreModule = require(file);
    if (fcoreModule._purityTests.constructor !== Function)
      throw new Error(`'${config.purityTests}' function missing. See docs.`);

    let purityTests = fcoreModule._purityTests(); // get tests
    if (purityTests.constructor === Function) purityTests = [purityTests]; // wrap in array

    if (purityTests.constructor !== Array)
      throw new TypeError(
        `'${config.purityTests}' must return a function, or an array of functions. See docs.`
      );

    const pureFunctions = []; // names of pure functions
    const errors = [];

    // run each test
    purityTests.forEach((runTest) => {
      let testedFunc;
      try {
        testedFunc = runTest();
        if (testedFunc.constructor !== Function)
          throw new TypeError(
            `all 'tests' (functions) returned by '${config.purityTests}' must return the tested function`
          );
        // passes test for purity
        if (pureFunctions.indexOf(testedFunc.name) === -1) {
          pureFunctions.push(testedFunc.name); // add it if didn't already
        }
      } catch (err) {
        if (err.name === "ReferenceError") {
          errors.push(err);
        } else {
          throw err; // rethrow unexpected error
        }
      }
    });

    return { pureFunctions, errors };
  }

  function discoverPureFunctions(file) {
    const { pureFunctions } = runPurityTests(file);
    return pureFunctions;
  }

module.exports = {
  getAllFilenames,
  removeDir,
  rewriteAll,
  getDependencies,
  clearRequireCache,
  runPurityTests,
  discoverPureFunctions,
};
