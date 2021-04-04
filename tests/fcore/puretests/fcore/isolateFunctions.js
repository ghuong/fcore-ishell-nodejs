/**
 * Parse the given source code for a module,
 * and for each function declaration, re-write its code-block to:
 * 1. be wrapped in a "use strict" closure (forcing "this" context to be undefined), and
 * 2. be wrapped in a VM sandbox (isolating the function from its lexical context)
 * @param {String} sourceCode module's source code
 * @param {Array<String>} dependencies names of the dependencies to inject into each sandbox
 * @param {Array<String>} ignoreFunctions names of functions to NOT re-write
 * @returns source code string representing the re-written module
 */
function isolateFunctions(sourceCode, dependencies, falafel) {
  return falafel(sourceCode, (node) => {
    // find each function body's code-block
    if (
      node.type === "BlockStatement" &&
      node.parent.type === "FunctionDeclaration"
    ) {
      // Dependencies to inject in sandboxes
      const sandboxDependencies = node.parent.params
        .map((param) => param.name) // give access to function parameters inside sandbox
        .concat(dependencies) // plus custom dependencies
        .concat(node.parent.id.name); // plus the function itself, to allow recursion

      // Wrap code block in "use strict" closure
      const preClosure = '`(function (){\n"use strict"\nreturn (function () ';
      const postClosure = "\n())}())`";
      const limitedCodeBlock = preClosure + node.source() + postClosure;

      // wrap in VM context
      const preVM =
        'const vm = require("vm");\nconst sandbox = {};\nvm.createContext(sandbox);\n const src = ';
      // add all arguments to the sandbox
      let postVM = "";
      sandboxDependencies.forEach((dep) => {
        postVM += `\nsandbox.${dep} = ${dep}`;
      });
      postVM += "\nreturn vm.runInContext(src, sandbox);\n";
      const rewrittenInnerCode = preVM + limitedCodeBlock + postVM;

      node.update("{\n" + rewrittenInnerCode + "}");
    }
  });
}

const falafel = require("falafel");
const puretest = require("../../../../fcore/.puretest");

module.exports = {
  isolateFunctions,
  _puretests: puretest(isolateFunctions, "function foo(a) { return a; }", ["myDep"], falafel)
}
