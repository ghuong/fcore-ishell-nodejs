describe("every function in fcore/", () => {
  const { fail } = require("assert");
  const path = require("path");
  const puretester = require("puretester");

  const fcoreDir = `${__dirname}/../../../fcore`; // directory of fcore/
  const rewriteDir = path.join(fcoreDir, ".rewrite"); // directory to re-write the fcore/ files

  let fcoreFiles; // filepaths relative to fcore/
  let fcoreFilepaths; // absolute filepaths

  before(() => {
    const { files, filepaths } = puretester.setup(fcoreDir, rewriteDir);
    fcoreFiles = files;
    fcoreFilepaths = filepaths;
  });

  it("takes at least one argument", () => {
    console.log("\nTest: it takes at least one argument");

    const { failMsg } = puretester.runPuretests(
      fcoreFilepaths,
      fcoreFiles,
      puretester.testModes.hasArgs
    );

    if (failMsg) {
      const fullFailMsg = `\n\nThese functions can be called with zero arguments:\n\n${failMsg}`;
      fail(fullFailMsg);
    }
  });

  it("returns a value", () => {
    console.log("\nTest: it returns a value");

    const { failMsg } = puretester.runPuretests(
      fcoreFilepaths,
      fcoreFiles,
      puretester.testModes.returnsValue
    );

    if (failMsg) {
      const fullFailMsg = `\n\nThese functions did not return a value:\n\n${failMsg}`;
      fail(fullFailMsg);
    }
  });

  /**
   * The files in fcore/ will be rewritten, wrapping all function declarations to run in isolated VM sandboxes.
   * This way, any impure function that either:
   * (a) produces side-effects in that sandbox, or
   * (b) relies on any external state (which will not be available in said sandbox)
   * will throw a ReferenceError when it runs, denoting it as impure.
   * Then, this test will fail if ANY such function is found to be impure, and pass otherwise.
   */
  it("can run in an isolated sandbox", () => {
    console.log("\nTest: it can run in an isolated sandbox");

    const sandboxedModules = puretester.rewriteModulesIntoSandboxes(
      fcoreFiles,
      fcoreDir,
      rewriteDir
    );

    const { successMsg, failMsg } = puretester.runPuretests(
      sandboxedModules,
      fcoreFiles
    );

    if (failMsg) {
      const fullFailMsg = `\n\nThese functions failed to run in isolated VM sandboxes:\n\n${failMsg}The re-written source code can be found in fcore/.rewrite/\n`;
      fail(fullFailMsg);
    } else {
      console.log(`\n${successMsg}`);
      puretester.teardown(rewriteDir);
    }
  });

  it("is a pure function expression", () => {
    console.log("\nTest: it is a pure function expression");

    const { successMsg, failMsg } = puretester.runPuretests(
      fcoreFilepaths,
      fcoreFiles,
      puretester.testModes.isPureExpression
    );

    if (failMsg) {
      const fullFailMsg = `\n\nThe npm module \`is-pure-function\` determined these functions to be impure:\n\n${failMsg}`;
      fail(fullFailMsg);
    } else {
      console.log(`\n${successMsg}`);
    }
  });
});
