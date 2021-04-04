const { fail } = require("assert");
const path = require("path");

const config = require("./ishell/config");
const fsHelper = require("./ishell/fsHelper");
const testHelper = require("./ishell/testHelper");
const rewriteSrcFiles = require("./ishell/rewriteSrcFiles");

describe("every function in fcore/", () => {
  let fcoreFiles; // filepaths relative to fcore/
  let fcoreFullFilepaths; // absolute filepaths

  before(() => {
    fsHelper.removeDir(config.rewriteDir); // nuke rewrites directory
    fcoreFiles = fsHelper.getRelativeFilepathsInDir(config.fcoreDir);
    fcoreFullFilepaths = fcoreFiles.map((f) => path.join(config.fcoreDir, f));
  });

  function assertAllPure(files, tester, failPreludeMsg, displayPureMsg = true) {
    const pureFuncsPerFile = files.map((x) => []);
    const impureFuncsPerFile = files.map((x) => []);
    const errorsPerFile = files.map((x) => []);

    let allPure = true;

    // Test all the modules one last time
    files.forEach((file, iFile) => {
      const { pure, impure, errors } = tester(file);

      if (impure.length > 0) {
        allPure = false;
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

    if (displayPureMsg) {
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
    }

    // Fail if there are still impure functions remaining
    if (!allPure) {
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

      fail(`\n\n${failPreludeMsg}:\n\n${impureMessage}`);
    }

    return allPure;
  }

  it("takes at least one argument", () => {
    console.log("Test: it takes at least one argument");
    const failPreludeMsg = "These functions can be called with zero arguments";
    assertAllPure(
      fcoreFullFilepaths,
      testHelper.runPuretests4,
      failPreludeMsg,
      false
    );
  });

  it("returns a value", () => {
    console.log("Test: it returns a value");
    const failPreludeMsg = "These functions did not return a value";
    assertAllPure(
      fcoreFullFilepaths,
      testHelper.runPuretests3,
      failPreludeMsg,
      false
    );
  });

  it("can run in an isolated sandbox", () => {
    console.log("Test: it can run in an isolated sandbox");

    /**
     * The files in fcore/ will be rewritten, wrapping all function declarations to run in isolated VM sandboxes.
     * This way, any impure function that either:
     * (a) produces side-effects in that sandbox, or
     * (b) relies on any external state (which will not be available in said sandbox)
     * will throw a ReferenceError when it runs, denoting it as impure.
     * Then, this test will fail if ANY such function is found to be impure, and pass otherwise.
     */
    const sandboxedModules = fcoreFiles.map((file) =>
      path.join(config.rewriteDir, file)
    );
    // copy `puretest.js` into .rewrite/
    fsHelper.copyFile(
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
      rewriteSrcFiles(
        fcoreFiles,
        config.fcoreDir, // from fcore/
        config.rewriteDir, // to fcore/.rewrite
        pureDepsPerFile // inject pure dependencies into sandboxes
      );

      testHelper.clearRequireCache(); // to force reload of the newly re-written files

      // test each rewritten module
      sandboxedModules.forEach((file, iFile) => {
        const { pure, errors } = testHelper.runPuretests(file);

        errors.forEach((error) => {
          if (error.name === "ReferenceError") {
            const dependency = testHelper.getReferenceFromError(error);
            depsPerFile[iFile].push(dependency);
          }
        });

        pure.forEach((pureFunc) => {
          if (!pureFuncsPerFile[iFile].includes(pureFunc)) {
            pureFuncsPerFile[iFile].push(pureFunc); // add it if didn't already
            numPureFuncsFoundThisIteration++;
          }

          // inject pure function into each file's sandbox that depends on it
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

    const failPreludeMsg =
      "These functions failed to run in isolated VM sandboxes";
    if (
      assertAllPure(sandboxedModules, testHelper.runPuretests, failPreludeMsg)
    ) {
      fsHelper.removeDir(config.rewriteDir);
    } else {
      console.error(
        "The re-written source code can be found in fcore/.rewrite/\n"
      );
    }
  });

  it("is a pure function expression", () => {
    console.log("Test: it is a pure function expression");
    const failPreludeMsg =
      "The npm module `is-pure-function` determined these functions to be impure";
    assertAllPure(fcoreFullFilepaths, testHelper.runPuretests2, failPreludeMsg);
  });
});
