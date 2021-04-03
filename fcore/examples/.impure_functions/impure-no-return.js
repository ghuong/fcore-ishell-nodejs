const puretest = require("../../.puretest");

function noReturnValue(a) {
  a++;
  //! returns undefined, this reeks of an effectful function!!
}

module.exports = {
  noReturnValue,
  _puretests: puretest(noReturnValue, 5)
}
