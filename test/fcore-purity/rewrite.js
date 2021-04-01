"use strict";

const fs = require("fs");
const path = require("path");
const falafel = require("falafel");
const mkdirp = require("mkdirp");

const config = require("./config");

/**
 * Rewrite contents of input file to an output file, applying the following transformation:
 * Parse the source code for function declarations, and rewrite its body to:
 * 1. be wrapped in a closure (in strict mode), forcing "this" context to be undefined,
 * 2. be wrapped in a VM sandbox, isolating it from its lexical context,
 * The rewritten function can then be tested for functional purity
 * For more, see: https://glebbahmutov.com/blog/test-if-a-function-is-pure-revisited/
 * @param {String} inputFilename path to input file
 * @param {String} outputFilename path to output file
 */
function rewrite(inputFilename, outputFilename, dependenciesToInject = []) {
  const source = fs.readFileSync(inputFilename, "utf8");
  const output = falafel(source, function (node) {
    if (
      node.type === "BlockStatement" &&
      node.parent.type === "FunctionDeclaration" &&
      node.parent.id.name !== config.purityTests
    ) {
      const vars = node.parent.params
        .map((node) => node.name)
        .concat(dependenciesToInject);
      // wrap function in "use strict" closure
      const pre = '`(function (){\n"use strict"\nreturn (function () ';
      const post = "\n())}())`";
      const limitedBlock = pre + node.source() + post;
      // wrap in VM context
      const preVm =
        'const vm = require("vm")\nconst sandbox = {}\nvm.createContext(sandbox)\n const src = ';
      // add all arguments to the sandbox
      let postVm = "";
      vars.forEach((name) => {
        postVm += "\nsandbox." + name + " = " + name;
      });
      postVm += "\nreturn vm.runInContext(src, sandbox)\n";
      const innerCode = preVm + limitedBlock + postVm;
      node.update("{\n" + innerCode + "}");
    }
  });

  mkdirp.sync(path.dirname(outputFilename));
  fs.writeFileSync(outputFilename, output, "utf8");
}

module.exports = rewrite;
