/**
 * This file starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests fail
 */

//! Calling impure functions will render caller impure too:
//? to test this: rename directory .impure to impure (without the dot . ), then run `npm test`
const add = require("./impure-add").add; // impure version

function sub(a, b) {
  return add(a, -b); // call impure function: 'add', this will FAIL the test
}

module.exports = {
  sub,
  _purityTests: () => () => {
    sub(2, 3);
    return sub;
  },
};
