const { fail, ok } = require("assert");
const path = require("path");

const config = require("./config");
const helper = require("./helper");

describe("every function in fcore/", () => {
  let fcoreFiles; // filepaths relative to fcore/

  before(() => {
    helper.removeDir(config.rewriteDir); // nuke rewrites directory
    fcoreFiles = helper.getRelativeFilepathsInDir(config.fcoreDir);
  });

  it("can run in an isolated sandbox", () => {
    /**
     * The files in fcore/ will be rewritten, wrapping all function declarations to run in isolated VM sandboxes.
     * This way, any impure function that either:
     * (a) produces side-effects in that sandbox, or
     * (b) relies on any external state (which will not be available in said sandbox)
     * will throw a ReferenceError when it runs, denoting it as impure.
     * Then, this test will fail if ANY such function is found to be impure, and pass otherwise.
     */
    let sandboxedModules = [];
    helper.copyFile(config.puretestFilename, config.fcoreDir, config.rewriteDir);

    // Keep track of the names of pure functions found in each file
    let pureFuncsPerModule = fcoreFiles.map((x) => []);
    // TODO: replace this with ReferenceError's reference name
    const depsPerModule = fcoreFiles.map((file) => {
      return helper.findRequiredDependenciesInSourceFile(
        path.join(config.fcoreDir, file)
      );
    });

    const pureDepsPerModule = fcoreFiles.map((x) => []);

    // console.log("moduleDependencies:", moduleDependencies);
    // console.log(pureFunctions);
    let numPureFunctionsFoundThisIteration;
    // This do..while will keep looping until no new pure functions are found
    do {
      numPureFunctionsFoundThisIteration = 0;
      // Rewrite fcore modules to run in sandboxes with pure dependencies injected
      // This way, functions which call other pure functions can be recognized as pure
      sandboxedModules = helper.rewriteAll(
        fcoreFiles,
        config.fcoreDir, // from fcore/
        config.rewriteDir, // to fcore/.rewrite
        pureDepsPerModule
      );

      helper.clearRequireCache(); // to force reload of the newly rewritten files

      // test each rewritten module
      sandboxedModules.forEach((moduleToTest, iMod) => {
        const { pure } = helper.runPuretests(moduleToTest); // test and get a list of pure functions

        pure.forEach((pureFunc) => {
          // inject pure func back into to same module
          if (!pureFuncsPerModule[iMod].includes(pureFunc)) {
            pureFuncsPerModule[iMod].push(pureFunc); // add it if didn't already
            pureDepsPerModule[iMod].push(pureFunc); // now functions in this module can call it too // TODO replace
            numPureFunctionsFoundThisIteration++;
          }

          // inject into all other modules too which have it as a dependency
          pureDepsPerModule.forEach((pureDepsInMod, iMod) => {
            if (
              depsPerModule[iMod].includes(pureFunc) &&
              !pureDepsInMod.includes(pureFunc)
            ) {
              pureDepsInMod.push(pureFunc);
            }
          });
        });
      });
      // console.log("numPureFunctionsDiscovered:", numPureFunctionsDiscovered);
      // console.log("pureFunctions:", pureFunctions);
    } while (numPureFunctionsFoundThisIteration > 0);

    const impureFuncsPerModule = fcoreFiles.map((x) => []);
    const errorsPerModule = fcoreFiles.map((x) => []);
    pureFuncsPerModule = fcoreFiles.map((x) => []);
    let impureFound = false;

    // Test all the modules one last time
    sandboxedModules.forEach((moduleToTest, iMod) => {
      const { pure, impure, errors } = helper.runPuretests(moduleToTest);

      if (impure.length > 0) {
        impureFound = true;
      }

      pure.forEach((pureFunc) => {
        pureFuncsPerModule[iMod].push(pureFunc);
      });

      impure.forEach((impureFunc) => {
        impureFuncsPerModule[iMod].push(impureFunc);
      });

      errors.forEach((error) => {
        errorsPerModule[iMod].push(error);
      });
    });

    // display information about pure functions for each module
    const pureMessage = pureFuncsPerModule
      .map((pureInModule, iMod) => {
        if (pureInModule.length === 0) return "";

        const indent = "\n ✅ ";
        const displayPure = indent + pureInModule.join(indent);
        return `${fcoreFiles[iMod]}:${displayPure}\n\n`;
      })
      .join("");

    console.log(`\nPure functions in fcore/:\n\n${pureMessage}`);

    // Fail if there are still impure functions remaining
    if (impureFound) {
      const impureMessage = impureFuncsPerModule
        .map((impureInModule, iMod) => {
          if (impureInModule.length === 0) return "";

          const indent = "\n ❌ ";
          const displayImpure = indent + impureInModule.map((impureFunc, iImp) => {
            const error = errorsPerModule[iMod][iImp];
            return `\`${impureFunc}\` threw: ${error}`;
          }).join(indent);
          return `${fcoreFiles[iMod]}:${displayImpure}\n\n`;
        })
        .join("");

      return fail(`\n\nThese functions failed to run in isolated VM sandboxes:\n\n${impureMessage}The re-written source code can be found in \`fcore/.rewrite/\`\n`);
    } else {
      helper.removeDir(config.rewriteDir);
    }
  });

  // it("has ")
});
