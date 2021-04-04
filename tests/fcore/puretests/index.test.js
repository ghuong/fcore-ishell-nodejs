const { fail } = require("assert");
const path = require("path");

const config = require("./ishell/config");
const fsHelper = require("./ishell/fsHelper");

const rewriteModulesIntoSandboxes = require("./ishell/rewriteModulesIntoSandboxes");
const { runPuretests } = require("./ishell/runPuretests");

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

    // copy puretest file //TODO: make puretest globally available, then remove this
    fsHelper.copyFile(
      config.puretestFilename,
      config.fcoreDir,
      config.rewriteDir
    );

    const sandboxedModules = rewriteModulesIntoSandboxes(
      fcoreFiles,
      config.fcoreDir,
      config.rewriteDir
    );

    const { successMsg, failMsg } = runPuretests(sandboxedModules, fcoreFiles);

    if (failMsg) {
      const fullFailMsg = `\n\nThese functions failed to run in isolated VM sandboxes:\n\n${failMsg}The re-written source code can be found in fcore/.rewrite/\n`;
      fail(fullFailMsg);
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
