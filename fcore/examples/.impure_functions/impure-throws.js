const puretest = require("../../.puretest");

function throwsError(a) {
  throw new Error("throwing some error");
}

module.exports = {
  throwsError,
  _puretests: puretest(throwsError, 5)
}