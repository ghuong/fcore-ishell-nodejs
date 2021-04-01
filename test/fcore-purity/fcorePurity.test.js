const { fail } = require("assert");
const fs = require("fs");
const path = require("path");

const config = require("./config");
const helper = require("./helper");

describe("all function declarations exported from modules in 'fcore/'", () => {

  after(function() {
    // helper.removeDir(config.rewriteDir);
  });

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

      helper.clearRequireCache(); // to reload new files

      rewrittenFiles.forEach((file, fileIdx) => {
        let discoveredPureFunctions;
        try {
          discoveredPureFunctions = helper.discoverPureFunctions(file);
        } catch (err) {
          return fail(`Error in 'fcore/${fcoreFiles[fileIdx]}': ${err}`);
        }

        discoveredPureFunctions.forEach((newPureFunc) => {
          // inject pure func back into to same module
          if (pureFunctions[fileIdx].indexOf(newPureFunc) === -1) {
            pureFunctions[fileIdx].push(newPureFunc); // add it if didn't already
            numPureFunctionsDiscovered++;
          }

          // inject into all other modules too which have it as a dependency
          pureFunctions.forEach((pureFunctionsInModule, moduleIdx) => {
            if (
              moduleDependencies[moduleIdx].includes(newPureFunc) &&
              pureFunctionsInModule.indexOf(newPureFunc) === -1
            ) {
              pureFunctionsInModule.push(newPureFunc);
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
      const { errors } = helper.runPurityTests(file);
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
