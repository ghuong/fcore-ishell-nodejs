const puretest = require("../../../.puretest");

// To call an external pure function, require it like so:
const add = require("../add/pure-add").add; // add is a pure function

function sub(a, b) {
  return add(a, -b); // call pure function: 'add', this will PASS the test
}

module.exports = {
  sub,
  // Unlike in add/pure-add.js, instead of returning an {Array<TestCase>},
  // only a single TestCase is returned by _puretests here:
  _puretests: puretest(sub, 2, 3),
};
