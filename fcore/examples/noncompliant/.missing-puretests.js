/**
 * This file starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests fail
 */

function foo(a) {
  return a;
}

//! missing _puretest function. Will throw an error in purity test
module.exports = {
  foo,
  // _puretest: () => () => { foo(5); return foo; } //! <-- missing!
};
