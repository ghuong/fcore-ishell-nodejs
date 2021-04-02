/**
 * This file/dir starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests fail
 */

const puretest = require("../../.puretest");

//! IMPURE: produces side-effect
function add(a, b) {
  launchNukes();
  return a + b;
}

//! IMPURE: produces side-effect
function add5(a) {
  declareWar();
  return a + 5;
}

function launchNukes() {
  console.log("Launching nukes! Impure side-effect!");
}

function declareWar() {
  console.log("Declaring war! Impure side-effect!");
}

module.exports = {
  add,
  add5,
  _puretests: 
    puretest(add, 2, 3)
    .puretest(add5, 4)
};
