/**
 * This file starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests pass even though they shouldn't
 */

const puretest = require("../../.puretest");

let counter = 0;

const multiply = function (a, b) {
  counter++; //! side-effect
  return a * b;
};

const multiply2 = function (a, b) {
  counter++;
  return a * b;
};

const multiply3 = (a, b) => {
  counter++;
  return a * b;
};

module.exports = {
  multiply,
  multiply2,
  multiply3,
  _puretests: 
    puretest(multiply, 2, 2)
    .puretest(multiply2, 3, 4)
    .puretest(multiply3, 5, 5),
};
