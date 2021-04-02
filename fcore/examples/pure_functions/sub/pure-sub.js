const puretest = require("../../../.puretest");

// To call an external pure function, require it like so:
const add = require("../add/pure-add").add; // `add` is pure

function sub(a, b) {
  return add(a, -b); // call pure function
}

module.exports = {
  sub,
  _puretests: 
    puretest(sub, 2, 3)
    .puretest(sub, 6, 3),
};
