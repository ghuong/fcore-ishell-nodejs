const path = require("path");

const fcoreDir = `${__dirname}/../../../../fcore`; // directory of fcore/
const rewriteDir = path.join(fcoreDir, ".rewrite"); // directory to re-write the fcore/ files

const puretestsProp = "_puretests"; // name of property on the module.exports object
const puretestFilename = ".puretest.js"; // filename for `puretest` helper function
const puretestHelper = "puretest"; // name of the `puretest` helper function

module.exports = {
  puretestsProp,
  puretestHelper,
  puretestFilename,
  fcoreDir,
  rewriteDir,
};
