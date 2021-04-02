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
    helper.copyFile(
      config.puretestFilename,
      config.fcoreDir,
      config.rewriteDir
    );

    let pureFuncsPerFile = fcoreFiles.map((x) => []); // pure functions found in each file
    const depsPerFile = fcoreFiles.map((x) => []); // dependencies each file relies on
    const pureDepsPerFile = fcoreFiles.map((x) => []); // those deps found to be pure

    let numPureFuncsFoundThisIteration;
    // This do..while will keep looping until no new pure functions are found
    do {
      numPureFuncsFoundThisIteration = 0;

      // Rewrite fcore modules to run in sandboxes with pure dependencies injected
      // This way, functions which call other pure functions can be recognized as pure
      sandboxedModules = helper.rewriteAll(
        fcoreFiles,
        config.fcoreDir, // from fcore/
        config.rewriteDir, // to fcore/.rewrite
        pureDepsPerFile // inject pure dependencies into sandboxes
      );

      helper.clearRequireCache(); // to force reload of the newly rewritten files

      // test each rewritten module
      sandboxedModules.forEach((file, iFile) => {
        const { pure, impure, errors } = helper.runPuretests(file);

        impure.forEach((impureFunc, idx) => {
          const error = errors[idx];
          if (error.name === "ReferenceError") {
            const dependency = helper.getReferenceFromError(error);
            depsPerFile[iFile].push(dependency);
          }
        });

        pure.forEach((pureFunc) => {
          if (!pureFuncsPerFile[iFile].includes(pureFunc)) {
            pureFuncsPerFile[iFile].push(pureFunc); // add it if didn't already
            numPureFuncsFoundThisIteration++;
          }

          // inject into all other modules too which have it as a dependency
          pureDepsPerFile.forEach((pureDepsInFile, iDependentFile) => {
            if (
              depsPerFile[iDependentFile].includes(pureFunc) &&
              !pureDepsInFile.includes(pureFunc)
            ) {
              pureDepsInFile.push(pureFunc); // add it if didn't already
            }
          });
        });
      });
    } while (numPureFuncsFoundThisIteration > 0);

    const impureFuncsPerFile = fcoreFiles.map((x) => []);
    const errorsPerFile = fcoreFiles.map((x) => []);
    pureFuncsPerFile = fcoreFiles.map((x) => []);
    let impureFound = false;

    // Test all the modules one last time
    sandboxedModules.forEach((file, iFile) => {
      const { pure, impure, errors } = helper.runPuretests(file);

      if (impure.length > 0) {
        impureFound = true;
      }

      pure.forEach((pureFunc) => {
        pureFuncsPerFile[iFile].push(pureFunc);
      });

      impure.forEach((impureFunc) => {
        impureFuncsPerFile[iFile].push(impureFunc);
      });

      errors.forEach((error) => {
        errorsPerFile[iFile].push(error);
      });
    });

    // display information about pure functions for each module
    const pureMessage = pureFuncsPerFile
      .map((pureInFile, iFile) => {
        if (pureInFile.length === 0) return "";

        const delim = "\n ✅ ";
        const displayPure = delim + pureInFile.join(delim);
        return `${fcoreFiles[iFile]}:${displayPure}\n\n`;
      })
      .join("");

    console.log(`\nPure functions in fcore/:\n\n${pureMessage}`);

    // Fail if there are still impure functions remaining
    if (impureFound) {
      const impureMessage = impureFuncsPerFile
        .map((impureInFile, iFile) => {
          if (impureInFile.length === 0) return "";

          const delim = "\n ❌ ";
          const displayImpure =
            delim +
            impureInFile
              .map((impureFunc, iImp) => {
                const error = errorsPerFile[iFile][iImp];
                return `\`${impureFunc}\` threw: ${error}`;
              })
              .join(delim);
          return `${fcoreFiles[iFile]}:${displayImpure}\n\n`;
        })
        .join("");

      return fail(
        `\n\nThese functions failed to run in isolated VM sandboxes:\n\n${impureMessage}The re-written source code can be found in \`fcore/.rewrite/\`\n`
      );
    }

    helper.removeDir(config.rewriteDir);
  });

  // it("has ")
});
