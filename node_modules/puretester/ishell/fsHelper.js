const fs = require("fs");
const path = require("path");

/**
 * List files in given directory recursively
 * @param {String} dir path of directory
 * @returns {Array<String>} relative filepaths
 */
function listFiles(dir) {
  const files = [];

  /**
   * Recursive helper
   * @param {String} baseDir path of base directory
   * @param {String} subDir relative path of sub-directory
   */
  function recurseIn(baseDir, subDir = "") {
    const currentDir = path.join(baseDir, subDir);

    fs.readdirSync(currentDir).forEach((file) => {
      if (file.startsWith(".")) return; // ignore files starting with . // TODO: remove

      const absoluteFilepath = path.join(currentDir, file);
      const relativeFilepath = path.join(subDir, file);
      if (fs.statSync(absoluteFilepath).isDirectory()) {
        recurseIn(baseDir, relativeFilepath); // go deeper into this directory
      } else {
        files.push(relativeFilepath);
      }
    });
  }

  recurseIn(dir);
  return files;
}

/**
 * Remove given directory if it exists
 * @param {String} dir directory to remove
 */
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

/**
 * Copy file from one directory to another
 * @param {String} file filepath relative to fromDir
 * @param {String} fromDir directory path containing file
 * @param {String} toDir directory path to copy file
 */
function copyFile(file, fromDir, toDir) {
  fs.mkdirSync(toDir, { recursive: true });
  fs.copyFileSync(path.join(fromDir, file), path.join(toDir, file));
}

module.exports = {
  listFiles,
  removeDir,
  copyFile,
};
