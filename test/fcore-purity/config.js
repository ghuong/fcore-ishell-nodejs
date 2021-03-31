const path = require("path");

const purityTests = "_purityTests";
const fcoreDir = `${__dirname}/../../fcore`;
const rewriteDir = path.join(fcoreDir, ".rewrite");

module.exports = {
  purityTests,
  fcoreDir,
  rewriteDir,
}