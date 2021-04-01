function add(a, b) {
  return a + b;
}

function add10(a) {
  return add(a, 10); // call to pure function in same file
}

module.exports = {
  add,
  add10,
  /**
   * Every fcore/ module MUST export a function _purityTests, which:
   * @returns {Array<TestCase>} a list containing one TestCase (which is a function)
   * for EACH function declared in the module file.
   * Each TestCase for a function must:
   *  1. call its respective function, at least once
   *  2. return said function at the end
   */
  _purityTests: () => [
    // TestCase for 'add'
    () => {
      add(2, 3); // call 'add' function
      return add; // return it at the end
    },
    // TestCase for 'add10'
    () => {
      add10(4);
      add10(6);
      add10(9); // can call multiple times
      return add10;
    }
  ]
};
