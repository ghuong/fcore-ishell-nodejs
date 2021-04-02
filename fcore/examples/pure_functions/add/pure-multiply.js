const puretest = require("../../../.puretest");

const multiply = function (a, b) {
  return a * b;
};

const multiply2 = function(a, b) {
  return a * b;
};

const multiply3 = (a, b) => {
  return a * b;
};

module.exports = {
  multiply,
  multiply2,
  multiply3,
  _puretests: puretest(multiply, 2, 2)
    .puretest(multiply2, 3, 4)
    .puretest(multiply3, 5, 5),
};
