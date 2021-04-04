function isArray(arr) {
  return Array.isArray(arr); // using existing global variable
}

const puretest = require("puretest");

module.exports = {
  isArray,
  _puretests: 
    puretest(isArray, [1, 2, 5])
};
