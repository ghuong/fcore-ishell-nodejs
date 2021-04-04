const { methodsOf } = require("../fcore/helpers");
const { puretestsProp: _puretests } = require("./config");

/**
 * Runs all puretests in the given files
 * @param {Array<String>} files list of filepaths
 * @param {String} fileNames names of files to display in messages
 * @param {String} testMode puretest mode (optional)
 * @returns object: { successMsg, failMsg }, messages describing the pure and impure functions
 */
function runPuretests(files, fileNames, testMode) {
  const pureFuncsPerFile = files.map((x) => []);
  const impureFuncsPerFile = files.map((x) => []);
  const errorsPerFile = files.map((x) => []);

  // Test all the modules one last time
  files.forEach((file, iFile) => {
    const { pure, impure, errors } = runPuretestsInModule(file, testMode);

    pureFuncsPerFile[iFile] = pure;
    impureFuncsPerFile[iFile] = impure;
    errorsPerFile[iFile] = errors;

    if (impure.length > 0) allPure = false;
  });

  const successMsg = pureFuncsPerFile
    .map((pureInFile, iFile) => {
      if (pureInFile.length === 0) return "";

      const delim = "\n ✅ ";
      const pureFuncs = delim + pureInFile.join(delim);
      return `${fileNames[iFile]}:${pureFuncs}\n\n`;
    })
    .join("");

  // Fail if there are still impure functions remaining
  const failMsg = impureFuncsPerFile
    .map((impureInFile, iFile) => {
      if (impureInFile.length === 0) return "";

      const delim = "\n ❌ ";
      const impureFuncs =
        delim +
        impureInFile
          .map((impureFunc, iImp) => {
            const error = errorsPerFile[iFile][iImp];
            return `\`${impureFunc}\` threw: ${error}`;
          })
          .join(delim);
      return `${fileNames[iFile]}:${impureFuncs}\n\n`;
    })
    .join("");

  return { successMsg, failMsg };
}

/**
 * Runs the "purity tests" defined within a given "fcore" module. See docs for explanation.
 * @param {String} modulePath name of fcore module
 * @param {String} testMode puretest mode (optional)
 * @returns an object { pureFunctions, errors }, where:
 *  - pure : list of names of pure functions declared in the module
 *  - impure : list of names of impure functions declared in the module
 *  - errors : list of errors thrown when each impure function was run in isolated VM sandbox
 */
function runPuretestsInModule(modulePath, testMode) {
  const fcoreModule = require(modulePath);

  const puretestsAreMissing = isMissingPuretests(fcoreModule);
  if (puretestsAreMissing) throw new Error(`${puretestsAreMissing}\nSee docs.`);

  return fcoreModule[_puretests]._run(testMode);
}

/**
 * Check if _puretests are missing from given module
 * @param {Object} moduleObj module object
 * @returns message describing any problems, otherwise false
 */
function isMissingPuretests(moduleObj) {
  if (!moduleObj[_puretests]) {
    return `Missing property \`${_puretests}\` in \`${fcoreModuleName}\`.`;
  }

  methodsOf(moduleObj).forEach((method) => {
    if (!moduleObj[_puretests]._hasTestFor(method)) {
      return `Missing puretest for method \`${method}\` in \`${fcoreModuleName}\`.`;
    }
  });

  return false;
}

module.exports = {
  runPuretests,
  runPuretestsInModule,
}
