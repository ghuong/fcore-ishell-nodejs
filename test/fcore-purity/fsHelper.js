const fs = require("fs");
const path = require("path");
const falafel = require("falafel");
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
          declaration.init?.object?.callee?.name === "require"
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
 *  - pureFunctions : list of names of pure functions declared in the module
 *  - errors : list of errors thrown in tests
 */
function runPurityTests(fcoreModuleName) {
  const fcoreModule = require(fcoreModuleName);
  if (
    !fcoreModule._purityTests ||
    fcoreModule._purityTests.constructor !== Function
  )
    throw new Error(`'${config.purityTests}' function missing. See docs.`);

  let purityTests = fcoreModule._purityTests(); // retrieve the set of tests

  if (!purityTests) {
    throw new Error(`${config.purityTests} returns undefined.`);
  }

  if (purityTests.constructor === Function) {
    // if only a single test case (a function) is provided...
    purityTests = [purityTests]; // wrap it in an array
  }

  if (purityTests.constructor !== Array || purityTests.length === 0) {
    throw new TypeError(
      `'${config.purityTests}' must return a function, or an array of functions. See docs.`
    );
  }

  const pureFunctions = []; // names of the functions that pass their test
  const errors = []; // errors thrown by the functions that fail their test

  // run each test case
  purityTests.forEach((runTest) => {
    let testedFunction;
    try {
      testedFunction = runTest(); // if test throws an error, it fails, otherwise it passes

      if (!testedFunction) {
        throw new TypeError(
          `${config.purityTests} must be a function that returns an array of test cases, or a single test case. Did you accidentally define it as a test case itself? Or did you forget to return the tested function in the TestCase?`
        );
      }

      if (testedFunction.constructor !== Function) {
        throw new TypeError(
          `all 'test cases' defined in '${config.purityTests}' must return the function being tested. See docs.`
        );
      }

      if (!pureFunctions.includes(testedFunction.name)) {
        pureFunctions.push(testedFunction.name); // add it if didn't already
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

/**
 * Finds the names of pure functions in given fcore module
 * @param {String} fcoreModuleName name of the fcore module
 * @returns list of names of pure functions declared in the module
 */
function findPureFunctions(fcoreModuleName) {
  const { pureFunctions } = runPurityTests(fcoreModuleName);
  return pureFunctions;
}

module.exports = {
  getRelativeFilepathsInDir,
  removeDir,
  rewriteAll,
  findRequiredDependenciesInSourceFile,
  clearRequireCache,
  runPurityTests,
  findPureFunctions,
};
