function noReturnValue(a) {
  a++;
  //! returns undefined, this reeks of an effectful function!!
}

const puretest = require("puretest");

module.exports = {
  noReturnValue,
  _puretests: puretest(noReturnValue, 5)
}
