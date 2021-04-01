/**
 * This file starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests fail
 */

function foo(a) {
  return a;
}

module.exports = {
  foo,
  //! _purityTests must be a function that returns a TestCase, NOT a TestCase itself!
  _purityTests: () => {
    foo(5);
    return foo;
  }
};
