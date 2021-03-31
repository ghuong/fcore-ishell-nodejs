const { fail } = require("assert");
const fs = require("fs");
const path = require("path");

const config = require("./config");
const helper = require("./helper");

describe("all function declarations exported from modules in 'fcore/'", () => {
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

  function clearRequireCache() {
    Object.keys(require.cache).forEach(function (key) {
      delete require.cache[key];
    });
  }

  it("are 'pure', i.e. producing NO side-effects, and relying on NO external state", () => {
    helper.removeDir(config.rewriteDir); // nuke rewrites directory

    // get relative paths of all files in fcore/ directory
    const fcoreFiles = helper.getAllFilenames(config.fcoreDir);

    /**
     * The fcore files will be rewritten so that their declared functions run in isolated sandboxes.
     * This way, any impure function that either:
     * (a) produces side-effects in that sandbox, or
     * (b) relies on any external state (which will not be available in said sandbox)
     * will throw a ReferenceError when it is called.
     * Then, this test will fail if ANY function is found to be impure, and pass otherwise.
     */
    let rewrittenFiles = []; // absolute file path names

    let pureFunctions = fcoreFiles.map((x) => []); // names of pure functions for each file
    const moduleDependencies = fcoreFiles.map((file) => {
      return helper.getDependencies(path.join(config.fcoreDir, file));
    });
    // console.log("moduleDependencies:", moduleDependencies);
    // console.log(pureFunctions);
    let numPureFunctionsDiscovered;
    // This do..while will keep looping until no new pure functions are discovered
    do {
      numPureFunctionsDiscovered = 0;
      // rewrite fcore modules, and inject all pure functions discovered so far into the sandboxes, so they can be called
      // this way, a function that only calls pure functions can be recognized as pure
      rewrittenFiles = helper.rewriteAll(
        fcoreFiles,
        config.fcoreDir, // from fcore/
        config.rewriteDir, // to fcore/.rewrite
        pureFunctions
      );

      clearRequireCache(); // to reload new files

      rewrittenFiles.forEach((file, idx) => {
        let discoveredPureFunctions;
        try {
          discoveredPureFunctions = discoverPureFunctions(file);
        } catch (err) {
          return fail(`Error in 'fcore/${fcoreFiles[idx]}': ${err}`);
        }

        pureFunctions.forEach((module, idx) => {
          // get intersection of new pure functions and the dependencies of each module
          const pureDependencies = discoveredPureFunctions.filter((pf) =>
            moduleDependencies[idx].includes(pf)
          );
          pureDependencies.forEach((pureDep) => {
            if (pureFunctions[idx].indexOf(pureDep) === -1) {
              pureFunctions[idx].push(pureDep); // add it if didn't already
              numPureFunctionsDiscovered++;
            }
          });
        });
      });
      // console.log("numPureFunctionsDiscovered:", numPureFunctionsDiscovered);
      // console.log("pureFunctions:", pureFunctions);
    } while (numPureFunctionsDiscovered > 0);

    const impureModules = [];

    // Fail if there are still impure functions remaining
    rewrittenFiles.forEach((file, idx) => {
      const { errors } = runPurityTests(file);
      errors.forEach((error) => {
        impureModules.push({ idx, error });
      });
    });

    if (impureModules.length > 0) {
      const message = impureModules
        .map(
          (module) =>
            `Error in 'fcore/${fcoreFiles[module.idx]}': ${module.error}`
        )
        .join("\n");

      fail(message); // fail test if there are any impure modules
    }
  });
});
