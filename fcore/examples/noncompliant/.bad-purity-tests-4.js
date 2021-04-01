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
  // All of the following will FAIL!
  // _purityTests: () => "hello" //! returning an arbitrary value
  // _purityTests: "hello" //! is an arbitrary value
  _purityTests: () => [] //! returning an empty array
};
