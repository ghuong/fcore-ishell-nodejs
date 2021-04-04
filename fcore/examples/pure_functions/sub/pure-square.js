const { multiply } = require("../add/pure-multiply");

function square(a) {
  return multiply(a, a); //* calling a pure function expression within a function declaraction is okay
}

const puretest = require("puretest");

module.exports = {
  square,
  _puretests:
    puretest(square, 4)
}