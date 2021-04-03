const puretest = require("../../.puretest");

//! a pure function MUST take arguments, otherwise, it's either impure, or it's just a constant...
function takesNoArgs() {
  return 5;
}

module.exports = {
  takesNoArgs,
  _puretests: puretest(takesNoArgs)
}