/**
 * This file starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests fail
 */

const puretest = require("puretest");

//! Renaming the exported function is NOT supported:
const myRenamedAdd = require("../pure_functions/add/pure-add").add;

//? See 'pure_functions/sub/pure-sub.js' for a proper example

function sub(a, b) {
  return myRenamedAdd(a, -b); //! will FAIL
}

module.exports = {
  sub,
  _puretests: 
    puretest(sub, 6, 3)
};
