const puretest = require("puretest");

function registeredWithPuretest(a) {
  return a;
}

function notRegisteredWithPuretest(a) {
  return a;
}

module.exports = {
  registeredWithPuretest,
  notRegisteredWithPuretest,
  _puretests:
    puretest(registeredWithPuretest, 4)         // <- is registered
    // .puretest(notRegisteredWithPuretest, 6)  //! <- MISSING!
}