const path = require("path");

const rewriteSrcFiles = require("./rewriteSrcFiles");
const helpers = require("./helpers");

const { runPuretestsInModule } = require("./runPuretests");

/**
 * Repeatedly re-writes the given modules to run in isolated sandboxes,
 * running each module's puretests to find the pure functions,
 * and injecting said pure functions back into the sandboxes of the modules which call them
 * @param {Array<String>} modules list of filepaths containing modules
 * @param {String} fromDir directory containing modules
 * @param {String} toDir directory to rewrite new modules
 */
function rewriteModulesIntoSandboxes(modules, fromDir, toDir) {
  const sandboxedModules = modules.map((mod) => path.join(toDir, mod));

  const pureFuncsPerMod = modules.map((m) => []); // pure functions found in each file
  const depsPerMod = modules.map((m) => []); // dependencies each file relies on
  const pureDepsPerMod = modules.map((m) => []); // those deps which are found to be pure

  let numPureFuncsFoundThisIteration;
  // This do..while will keep looping until no new pure functions are found
  do {
    numPureFuncsFoundThisIteration = 0;

    // Rewrite fcore modules to run in sandboxes with pure dependencies injected
    // This way, functions which call other pure functions can be recognized as pure
    rewriteSrcFiles(modules, fromDir, toDir, pureDepsPerMod);

    helpers.clearRequireCache(); // to force reload of the newly re-written files

    // test each rewritten module
    sandboxedModules.forEach((mod, iMod) => {
      const { pure, errors } = runPuretestsInModule(mod);

      errors.forEach((error) => {
        if (error.name === "ReferenceError") {
          const dependency = helpers.getReferenceFromError(error);
          depsPerMod[iMod].push(dependency);
        }
      });

      pure.forEach((pureFunc) => {
        if (!pureFuncsPerMod[iMod].includes(pureFunc)) {
          pureFuncsPerMod[iMod].push(pureFunc); // add it if didn't already
          numPureFuncsFoundThisIteration++;
        }

        // inject pure function into each file's sandbox that depends on it
        pureDepsPerMod.forEach((pureDepsInFile, iDependentFile) => {
          if (
            depsPerMod[iDependentFile].includes(pureFunc) &&
            !pureDepsInFile.includes(pureFunc)
          ) {
            pureDepsInFile.push(pureFunc); // add it if didn't already
          }
        });
      });
    });
  } while (numPureFuncsFoundThisIteration > 0);

  return sandboxedModules;
}

module.exports = rewriteModulesIntoSandboxes;
