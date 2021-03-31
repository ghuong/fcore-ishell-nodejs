const rewrite = require("./rewrite");
const fs = require("fs");
const path = require("path");

/**
 * Get all filenames in a directory recursively as an array of relative paths
 * @param {String} directoryPath directory path to look in
 * @returns an array of string file paths relative to directoryPath
 */
function getAllFilenames(directoryPath) {
  const files = [];

  function getAllFilenamesRecursively(baseDirPath, nestedDirPath = "") {
    const dirPath = nestedDirPath
      ? path.join(baseDirPath, nestedDirPath)
      : baseDirPath;

    fs.readdirSync(dirPath).forEach((file) => {
      const absoluteFilePath = path.join(dirPath, file);
      const relativeFilePath = path.join(nestedDirPath, file);
      if (fs.statSync(absoluteFilePath).isDirectory()) {
        getAllFilenamesRecursively(baseDirPath, relativeFilePath);
      } else {
        files.push(relativeFilePath);
      }
    });
  }

  getAllFilenamesRecursively(directoryPath);
  return files;
}

module.exports = {
  getAllFilesInDir: getAllFilenames,
};
