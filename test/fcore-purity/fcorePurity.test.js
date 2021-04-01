const { fail, ok } = require("assert");
const path = require("path");

const config = require("./config");
const fsHelper = require("./fsHelper");

describe("every function in fcore/", () => {
  let fcoreRelativeFilepaths; // filepaths relative to fcore/

  before(() => {
    fsHelper.removeDir(config.rewriteDir); // nuke rewrites directory
    fcoreRelativeFilepaths = fsHelper.getRelativeFilepathsInDir(
      config.fcoreDir
    );
  });

  after(() => {
    // helper.removeDir(config.rewriteDir);
  });

  it("is pure", () => {
    /**
     * The files in fcore/ will be rewritten, wrapping all function declarations to run in isolated VM sandboxes.
     * This way, any impure function that either:
     * (a) produces side-effects in that sandbox, or
     * (b) relies on any external state (which will not be available in said sandbox)
     * will throw a ReferenceError when it runs, denoting it as impure.
     * Then, this test will fail if ANY such function is found to be impure, and pass otherwise.
     */
    let rewrittenFilesAbsolutePaths = [];

    // Keep track of the names of pure functions found in each file
    let pureFunctionsPerFile = fcoreRelativeFilepaths.map((x) => []);
    const dependenciesPerModule = fcoreRelativeFilepaths.map((file) => {
      return fsHelper.findRequiredDependenciesInSourceFile(
        path.join(config.fcoreDir, file)
      );
    });
    // console.log("moduleDependencies:", moduleDependencies);
    // console.log(pureFunctions);
    let numPureFunctionsFoundThisIteration;
    // This do..while will keep looping until no new pure functions are found
    do {
      numPureFunctionsFoundThisIteration = 0;
      // rewrite fcore modules, and inject all pure functions discovered so far into the sandboxes, so they can be called
      // this way, a function that only calls pure functions can be recognized as pure
      rewrittenFilesAbsolutePaths = fsHelper.rewriteAll(
        fcoreRelativeFilepaths,
        config.fcoreDir, // from fcore/
        config.rewriteDir, // to fcore/.rewrite
        pureFunctionsPerFile
      );

      fsHelper.clearRequireCache(); // to reload new files

      rewrittenFilesAbsolutePaths.forEach(
        (moduleFilepath, idxFileBeingSearched) => {
          let pureFunctionsFoundInModule;
          try {
            pureFunctionsFoundInModule = fsHelper.findPureFunctions(
              moduleFilepath
            );
          } catch (err) {
            return fail(
              `Error in 'fcore/${fcoreRelativeFilepaths[idxFileBeingSearched]}': ${err}`
            );
          }

          pureFunctionsFoundInModule.forEach((pureFunctionFound) => {
            // inject pure func back into to same module
            if (
              !pureFunctionsPerFile[idxFileBeingSearched].includes(
                pureFunctionFound
              )
            ) {
              pureFunctionsPerFile[idxFileBeingSearched].push(
                pureFunctionFound
              ); // add it if didn't already
              numPureFunctionsFoundThisIteration++;
            }

            // inject into all other modules too which have it as a dependency
            pureFunctionsPerFile.forEach(
              (pureFunctionsInModule, idxModuleWithDependencies) => {
                if (
                  dependenciesPerModule[idxModuleWithDependencies].includes(
                    pureFunctionFound
                  ) &&
                  !pureFunctionsInModule.includes(pureFunctionFound)
                ) {
                  pureFunctionsInModule.push(pureFunctionFound);
                  numPureFunctionsFoundThisIteration++;
                }
              }
            );
          });
        }
      );
      // console.log("numPureFunctionsDiscovered:", numPureFunctionsDiscovered);
      // console.log("pureFunctions:", pureFunctions);
    } while (numPureFunctionsFoundThisIteration > 0);

    const errorsPerModule = fcoreRelativeFilepaths.map((x) => []);
    const pureFunctionsPerModule = fcoreRelativeFilepaths.map((x) => []);
    let foundError = false;

    // Test all the modules one last time
    rewrittenFilesAbsolutePaths.forEach((fcoreModuleName, moduleIdx) => {
      const { pureFunctions, errors } = fsHelper.runPurityTests(
        fcoreModuleName
      );

      pureFunctions.forEach((pureFunction) => {
        pureFunctionsPerModule[moduleIdx].push(pureFunction);
      });

      errors.forEach((error) => {
        errorsPerModule[moduleIdx].push(error);
        foundError = true;
      });
    });

    // display information about pure functions for each module
    const pureMessage = pureFunctionsPerModule
      .map((pureFunctionsInModule, moduleIdx) => {
        if (pureFunctionsInModule.length === 0) return "";

        const listOfPureFunctionsMessage = pureFunctionsInModule.join("\n ✅ ");
        return `'${fcoreRelativeFilepaths[moduleIdx]}' has pure functions:\n ✅ ${listOfPureFunctionsMessage}\n\n`;
      })
      .join("");

    console.log(`\n${pureMessage}\n`);

    // Fail if there are still impure functions remaining
    if (foundError) {
      const impureMessage = errorsPerModule
        .map((errorsInModule, moduleIdx) => {
          if (errorsInModule.length === 0) return "";

          const listOfErrorsMessage = errorsInModule.join("\n ❌ ");
          return `'${fcoreRelativeFilepaths[moduleIdx]}' has errors:\n ❌ ${listOfErrorsMessage}\n\n`;
        })
        .join("");

      return fail(`\n\n${impureMessage}`);
    }
  });
});
