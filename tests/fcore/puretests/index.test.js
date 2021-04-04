const { fail } = require("assert");
const path = require("path");

const config = require("./ishell/config");
const fsHelper = require("./ishell/fsHelper");
const testHelper = require("./ishell/testHelper");
const { runPuretests, runPuretestsInModule } = require("./ishell/runPuretests");
const rewriteSrcFiles = require("./ishell/rewriteSrcFiles");

describe("every function in fcore/", () => {
  let fcoreFiles; // filepaths relative to fcore/
  let fcoreFilepaths; // absolute filepaths

  before(() => {
    fsHelper.removeDir(config.rewriteDir); // nuke rewrites directory
    fcoreFiles = fsHelper.listFiles(config.fcoreDir);
    fcoreFilepaths = fcoreFiles.map((f) => path.join(config.fcoreDir, f));
  });

  it("takes at least one argument", () => {
    console.log("\nTest: it takes at least one argument");

    const { failMsg } = runPuretests(
      fcoreFilepaths,
      fcoreFiles,
      config.testModes.hasArgs
    );

    if (failMsg) {
      const fullFailMsg = `\n\nThese functions can be called with zero arguments:\n\n${failMsg}`;
      fail(fullFailMsg);
    }
  });

  it("returns a value", () => {
    console.log("\nTest: it returns a value");

    const { failMsg } = runPuretests(
      fcoreFilepaths,
      fcoreFiles,
      config.testModes.returnsValue
    );

    if (failMsg) {
      const fullFailMsg = `\n\nThese functions did not return a value:\n\n${failMsg}`;
      fail(fullFailMsg);
    }
  });

  it("can run in an isolated sandbox", () => {
    console.log("\nTest: it can run in an isolated sandbox");

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
        const { pure, errors } = runPuretestsInModule(file);

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

    const { successMsg, failMsg } = runPuretests(sandboxedModules, fcoreFiles);

    if (failMsg) {
      const fullFailMsg = `\n\nThese functions failed to run in isolated VM sandboxes:\n\n${failMsg}The re-written source code can be found in fcore/.rewrite/\n`;
      return fail(fullFailMsg);
    } else {
      console.log(`\n${successMsg}`);
      fsHelper.removeDir(config.rewriteDir);
    }
  });

  it("is a pure function expression", () => {
    console.log("\nTest: it is a pure function expression");

    const { successMsg, failMsg } = runPuretests(
      fcoreFilepaths,
      fcoreFiles,
      config.testModes.isPureExpression
    );

    if (failMsg) {
      const fullFailMsg = `\n\nThe npm module \`is-pure-function\` determined these functions to be impure:\n\n${failMsg}`;
      fail(fullFailMsg);
    } else {
      console.log(`\n${successMsg}`);
    }
  });
});
