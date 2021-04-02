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
        console.log("existingTestCase:", existingTestCase);
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
        };
        this._testcases.push(newTestcase);
      }
      return this;
    },
    _run: function () {
      const pure = []; // names of the functions that pass their test
      const impure = []; // names of the functions that fail their test
      const errors = []; // errors thrown by the functions that fail their test

      // run each test case
      this._testcases.forEach((testcase) => {
        const error = testcase.run(); // if test throws an error, it fails, otherwise it passes

        if (error) {
          impure.push(testcase.name);
          errors.push(error);
        } else {
          pure.push(testcase.name);
        }
      });

      return { pure, impure, errors };
    },
  }._init(_functionToTest, ..._args);
}

// function arr(itemX) {
//   const toReturn = {
//     init: function (item) {
//       this._items = [item];
//       return this;
//     },
//     push: function (item) {
//       this._items.push(item);
//       return this;
//     },
//     pop: function (item) {
//       this._items.pop();
//       return this;
//     },
//     shift: function () {
//       this._items.shift();
//       return this;
//     },
//     unshift: function (item) {
//       this._items.unshift(item);
//       return this;
//     },
//     pushX: function () {
//       this._items.push(itemX);
//       return this;
//     },
//     print: function () {
//       console.log(this._items);
//       return this;
//     },
//   }.init(itemX);

//   itemX = null;
//   return toReturn;
// }

module.exports = puretest;
