const { puretestsProp: _puretests } = require("./config");

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

  if (!fcoreModule[_puretests]) {
    throw new Error(
      `Missing property \`${_puretests}\` in \`${fcoreModuleName}\`.\nSee docs.`
    );
  }

  methodsOf(fcoreModule).forEach((method) => {
    if (!fcoreModule[_puretests]._hasTestFor(method)) {
      throw new Error(
        `Missing puretest for method \`${method}\` in \`${fcoreModuleName}\`.\nSee docs.`
      );
    }
  });

  return fcoreModule[_puretests]._run(_mode);
}

function isPuretestsDefined(fcoreModuleName) {
  const fcoreModule = require(fcoreModuleName);

  if (!fcoreModule[_puretests]) {
    throw new Error(
      `Missing property \`${_puretests}\` in \`${fcoreModuleName}\`.\nSee docs.`
    );
  }

  methodsOf(fcoreModule).forEach((method) => {
    if (!fcoreModule[_puretests]._hasTestFor(method)) {
      throw new Error(
        `Missing puretest for method \`${method}\` in \`${fcoreModuleName}\`.\nSee docs.`
      );
    }
  });
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

/**
 * Get all names of methods of a given object
 * @param {Object} obj object
 * @returns list of names of methods on the object
 */
function methodsOf(obj) {
  return Object.getOwnPropertyNames(obj).filter(
    (prop) => obj[prop].constructor === Function
  );
}

/**
 * Get the name of the undefined reference which caused a ReferenceError
 * @param {ReferenceError} referenceError
 * @returns name of reference
 */
function getReferenceFromError(referenceError) {
  if (referenceError.name !== "ReferenceError")
    throw new TypeError("argument must be a ReferenceError");

  if (referenceError.message.includes("is not defined")) {
    return referenceError.message.split(" ")[0]; // the first word is the name
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
