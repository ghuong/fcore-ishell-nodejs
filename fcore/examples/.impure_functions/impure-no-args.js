//! a pure function MUST take arguments, otherwise, it's either impure, or it's just a constant...
function takesNoArgs() {
  return 5;
}

const puretest = require("puretest");

module.exports = {
  takesNoArgs,
  _puretests: puretest(takesNoArgs)
}