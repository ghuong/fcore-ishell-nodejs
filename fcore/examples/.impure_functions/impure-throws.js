function throwsError(a) {
  throw new Error("throwing some error");
}

const puretest = require("puretest");

module.exports = {
  throwsError,
  _puretests: puretest(throwsError, 5)
}