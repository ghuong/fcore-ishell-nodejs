const isPureFunction = require("is-pure-function");

/**
 * Tests whether a given function is a function expression
 * @param code function to test
 * @returns true iff its an expression (function declarations are not expressions)
 * Credit: https://stackoverflow.com/a/11938073
 */
const isExpression = (function (functionDeclaration) {
  return function (code) {
    if (functionDeclaration.test(code)) return false;

    try {
      Function("return " + code);
      return true;
    } catch (error) {
      return false;
    }
  };
})(new RegExp(/^\s*function\s[^(]/));

/**
 * Every fcore/ module MUST export a property named _puretests,
 * which calls `puretest` for each function in the module with arguments
 * @param {Function} _functionToTest function to test
 * @param  {...any} _args arguments to pass to function
 * Usage:
 * module.exports = {
 *    add,
 *    add10,
 *    add50,
 *    _puretests:
 *      puretest(add, 1, 2) // test function call: `add(1, 2)`
 *      .puretest(add10, 3) // test function call: `add10(3)`
 *      .puretest(add50, 7) // test function call: `add50(7)`
 * }
 */
function puretest(_functionToTest, ..._args) {
  if (!_functionToTest) throw new Error("Missing argument: _functionToTest");

  return {
    _init: function (functionToTest, ...args) {
      if (!this._testcases) {
        this._testcases = [];
      }
      return this.puretest(functionToTest, ...args);
    },
    puretest: function (functionToTest, ...args) {
      const existingTestCase = this._testcases.find(
        (testcase) => testcase.name === functionToTest.name
      );
      if (existingTestCase) {
        existingTestCase.argsLists.push(args);
      } else {
        const newTestcase = {
          func: functionToTest,
          name: functionToTest.name,
          argsLists: [args],
          // run func with each set of args, return error, if any
          run: function () {
            try {
              this.argsLists.forEach((args) => {
                this.func(...args);
              });
              return null; // no errors to report
            } catch (err) {
              return err; // function threw an error
            }
          },
          run2: function () {
            const allPure = this.argsLists.every((args) =>
              isPureFunction(this.func, null, args)
            );

            return allPure ? null : new Error("function is impure");
          },
        };
        this._testcases.push(newTestcase);
      }
      return this;
    },
    _run: function (_alt = false) {
      const pure = []; // names of the functions that pass their test
      const impure = []; // names of the functions that fail their test
      const errors = []; // errors thrown by the functions that fail their test

      // run each test case
      this._testcases.forEach((testcase) => {
        if (_alt && !isExpression(testcase.func)) return; // in alt mode, skip function declarations

        // if test throws an error, it fails, otherwise it passes
        const error = _alt ? testcase.run2() : testcase.run();

        if (error) {
          impure.push(testcase.name);
          errors.push(error);
        } else {
          pure.push(testcase.name);
        }
      });

      return { pure, impure, errors };
    },
    _run2: function () {
      return this._run(true);
    },
  }._init(_functionToTest, ..._args);
}

module.exports = puretest;
