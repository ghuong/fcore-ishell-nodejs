function add(a, b) {
  return a + b;
}

function add10(a) {
  return add(a, 10); // call to pure function in same file
}

const puretest = require("puretest");

module.exports = {
  add,
  add10,
  /**
   * Every fcore/ module MUST export a function _puretests, which:
   * @returns {Array<TestCase>} a list containing one TestCase (which is a function)
   * for EACH function declared in the module file.
   * Each TestCase for a function must:
   *  1. call its respective function, at least once
   *  2. return said function at the end
   */
  _puretests:
    puretest(add, 3, 4)
    .puretest(add10, 5)
};
