const puretest = require("../../.puretest");
const { multiply } = require("../pure_functions/add/pure-multiply");

//! FUNCTION EXPRESSIONS MAY NOT CALL EXTERNAL PURE FUNCTIONS
const square = function (a) {
  return multiply(a, a); // calls to pure functions not allowed in function expressions, use function declarations instead
};

module.exports = {
  square,
  _puretests: puretest(square, 4),
};
