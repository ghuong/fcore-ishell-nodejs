const path = require("path");

// const puretestsProp = "_puretests"; // name of property of module.exports object for each fcore/ file
const puretestHelper = "puretest"; // name of the `puretest` helper function
const puretestFilename = ".puretest.js"; // filename for `puretest` helper function

const fcoreDir = `${__dirname}/../../../../fcore`; // directory of fcore/
const rewriteDir = path.join(fcoreDir, ".rewrite"); // directory to re-write the fcore/ files

module.exports = {
  // puretestsProp,
  puretestHelper,
  puretestFilename,
  fcoreDir,
  rewriteDir,
};
