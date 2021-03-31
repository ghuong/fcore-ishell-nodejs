const falafel = require("falafel");
const rewrite = require("./rewrite");
const fs = require("fs");
const path = require("path");

/**
 * Get all filenames in a directory recursively as an array of relative paths,
 * but ignore directories starting with `.`
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
      if (file.startsWith(".")) return;

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

/**
 * Remove the .rewrites directory
 */
function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

/**
 * Rewrite fcore/ files to .rewrite/
 * @param {Array<String>} files list of relative file paths contained in fromDir
 * @param {String} fromDir directory holding input files
 * @param {String} toDir directory to write output files
 * @returns list of absolute paths of all output files
 */
function rewriteAll(files, fromDir, toDir, pureFunctions = []) {
  return files.map((file, idx) => {
    const inputFile = path.join(fromDir, file);
    const outputFile = path.join(toDir, file);
    rewrite(inputFile, outputFile, pureFunctions.length > 0 ? pureFunctions[idx] : []);
    return outputFile;
  });
}

/**
 * 
 * @param {Array<String>} file file path
 */
function getDependencies(file) {
  const dependencies = [];

  const source = fs.readFileSync(file, "utf8");
  falafel(source, function (node) {
    if (node.type === "VariableDeclaration") {
      node.declarations.forEach(dec => {
        if (dec.init?.object?.type === "CallExpression" && dec.init?.object?.callee?.name === "require") {
          dependencies.push(dec.id.name);
        }
      });
      // console.log("id:", node.declarations[0].id.name);
      // console.log("init:", node.declarations[0].init);
    }
  });

  return dependencies;
}

module.exports = {
  getAllFilenames,
  removeDir,
  rewriteAll,
  getDependencies,
};
