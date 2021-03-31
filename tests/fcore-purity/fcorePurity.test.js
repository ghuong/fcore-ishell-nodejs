const fs = require("fs");
const path = require("path");
const helper = require("./helper");
const rewrite = require("./rewrite");

describe("all fcore modules", () => {
  const fcoreDir = `${__dirname}/../../fcore`;
  const rewriteDir = path.join(fcoreDir, "rewrite")

  beforeAll(() => {
    const files = helper.getAllFilesInDir(fcoreDir);
    console.log("files:", files);
    files.forEach((file) => {
      const inputFile = path.join(fcoreDir, file);
      const outputFile = path.join(rewriteDir, file);
      console.log("input:", inputFile);
      console.log("output:", outputFile);
      rewrite(inputFile, outputFile);
    });
  });

  afterAll(() => {
    // fs.rmdirSync(rewriteDir);
  });

  test("blah", () => {});
});
