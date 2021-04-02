const puretest = require("../../../.puretest");
const { multiply } = require("../add/pure-multiply");

function square(a) {
  return multiply(a, a); //* calling a pure function expression within a function declaraction is okay
}

module.exports = {
  square,
  _puretests:
    puretest(square, 4)
}