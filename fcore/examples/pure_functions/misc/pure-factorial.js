const puretest = require("../../../.puretest");

function factorial(a) {
  if (a <= 1) return 1;
  else return a * factorial(a - 1); // calling itself
}

module.exports = {
  factorial,
  _puretests:
    puretest(factorial, 3)
};
