const puretest = require("../../../.puretest");

function isArray(arr) {
  return Array.isArray(arr); // using existing global variable
}

module.exports = {
  isArray,
  _puretests: 
    puretest(isArray, [1, 2, 5])
};
