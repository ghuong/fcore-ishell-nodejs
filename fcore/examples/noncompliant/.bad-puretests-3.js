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
  _puretests: () => [
    () => {
      return foo(5); //! Must return the function itself, NOT the result of calling it!
      // return foo; //* <-- this is correct
    },
  ],
};
