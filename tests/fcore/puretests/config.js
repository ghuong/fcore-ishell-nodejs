const path = require("path");

const puretests = "_puretests";
const puretestHelper = "puretest";
const puretestFilename = ".puretest.js";
const fcoreDir = `${__dirname}/../../../fcore`;
const rewriteDir = path.join(fcoreDir, ".rewrite");

module.exports = {
  puretests,
  puretestHelper,
  puretestFilename,
  fcoreDir,
  rewriteDir,
};
