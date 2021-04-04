const config = require("./config");

/**
 * Clear require cache to force reload of modules
 */
function clearRequireCache() {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
}

/**
 * Runs the "purity tests" defined within a given "fcore" module. See docs for explanation.
 * @param {String} fcoreModuleName name of fcore module
 * @returns an object { pureFunctions, errors }, where:
 *  - pure : list of names of pure functions declared in the module
 *  - impure : list of names of impure functions declared in the module
 *  - errors : list of errors thrown when each impure function was run in isolated VM sandbox
 */
function runPuretests(fcoreModuleName, _mode) {
  const fcoreModule = require(fcoreModuleName);

  getMethods(fcoreModule).forEach((method) => {
    if (!fcoreModule._puretests._hasTestFor(method)) {
      throw new Error(
        `Missing puretest for method \`${method}\` in \`${fcoreModuleName}\`.\nSee docs.`
      );
    }
  });

  if (
    !fcoreModule._puretests ||
    fcoreModule._puretests.constructor !== Object
  ) {
    throw new Error(
      `Missing \`${config.puretests}\` in \`${fcoreModuleName}\`.\nSee docs.`
    );
  }

  switch (_mode) {
    case "isPureExpression":
      return fcoreModule._puretests._run2();
    case "returnsValue":
      return fcoreModule._puretests._run3();
    case "hasArgs":
      return fcoreModule._puretests._hasArgs();
    default:
      return fcoreModule._puretests._run();
  }
}

// Alternate version of puretest
function runPuretests2(fcoreModuleName) {
  return runPuretests(fcoreModuleName, "isPureExpression");
}

// Verify that registered module methods return a value
function runPuretests3(fcoreModuleName) {
  return runPuretests(fcoreModuleName, "returnsValue");
}

// Verify that registered module methods take at least one argument
function runPuretests4(fcoreModuleName) {
  return runPuretests(fcoreModuleName, "hasArgs");
}

// Get all names of methods of an object
function getMethods(obj) {
  return Object.getOwnPropertyNames(obj).filter(
    (prop) => obj[prop].constructor === Function
  );
}

/**
 * reference error
 * @param {ReferenceError} referenceError
 * @returns name of the reference which is not defined
 */
function getReferenceFromError(referenceError) {
  if (referenceError.name !== "ReferenceError")
    throw new TypeError("argument must be a ReferenceError");

  const errMsg = referenceError.message;
  if (errMsg.includes("is not defined")) {
    return errMsg.split(" ")[0];
  }
}

module.exports = {
  clearRequireCache,
  runPuretests,
  runPuretests2,
  runPuretests3,
  runPuretests4,
  getReferenceFromError,
};
