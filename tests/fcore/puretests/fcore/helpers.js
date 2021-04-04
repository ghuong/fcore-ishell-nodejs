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

const puretest = require("../../../../fcore/.puretest");

module.exports = {
  methodsOf,
  getReferenceFromError,
  _puretests:
    puretest(methodsOf, { method: () => {} })
    .puretest(getReferenceFromError, new ReferenceError("myRef is not defined"))
};
