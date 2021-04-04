function factorial(a) {
  if (a <= 1) return 1;
  else return a * factorial(a - 1); // calling itself
}

const puretest = require("puretest");

module.exports = {
  factorial,
  _puretests:
    puretest(factorial, 3)
};
