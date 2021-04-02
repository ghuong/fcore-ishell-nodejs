/**
 * This file starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests fail
 */

const puretest = require("../../.puretest");

//! Renaming the exported function is NOT supported:
const myAdd = require("../pure_functions/add/pure-add").add;

//! Requiring whole module is NOT supported:
// const adderModule = require("../add/pure-add");
// const add = adderModule.add;

// TODO: Destructuring syntax is currently NOT supported:
// const { add } = require("../add/pure-add");

//? See 'pure_functions/pure-sub.js' for a proper example

function sub(a, b) {
  return myAdd(a, -b); //! will FAIL
  // return add(a, -b);
}

module.exports = {
  sub,
  _puretests: 
    puretest(sub, 6, 3)
};
