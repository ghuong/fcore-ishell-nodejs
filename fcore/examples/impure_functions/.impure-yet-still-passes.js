/**
 * This file starts with a dot . so it will be ignored by the purity tester.
 * To test this file, rename it without the dot .
 * then run `npm test` to see how the tests pass even though they shouldn't
 */

const path = require("path"); // external dependency

let externalState = "before";

//! DO NOT USE FUNCTION EXPRESSIONS / ARROW FUNCTIONS!
//! This is IMPURE, yet still passes the test!
const getFilenameIMPURE = (filepath) => {
  externalState = "after"; // modifies external state
  return path.basename(filepath); // calls external dependency
};

module.exports = {
  getFilenameIMPURE,
  _purityTests: () => [
    () => {
      getFilenameIMPURE("/foo/bar.txt");
      return getFilenameIMPURE;
    },
  ],
};