# fcore-ishell-nodejs

## Table of Contents

- [About](#about)
- [Getting Started](#getting_started)
- [Project Structure](#project_structure)
- [Functional Core](#fcore)
    - [Definition of "Pure Function"](#purefunc)
    - [Registering Methods with puretest](#registering)
- [Imperative Shell](#ishell)
- [The Approach to Testing](#testing)
- [How the "Pure Tests" Work](#puretests)

## About <a name = "about"></a>

A template [Node.js](https://nodejs.org/en/) app enforcing [Functional Core, Imperative Shell](https://github.com/kbilsted/Functional-core-imperative-shell/blob/master/README.md) pattern.

For an introduction to this architectural pattern, see the talk [Boundaries](https://www.youtube.com/watch?v=eOYal8elnZk) by the creator Gary Bernhardt.

## Getting Started <a name = "getting_started"></a>

[Github Docs: Creating a Repository From a Template](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template#creating-a-repository-from-a-template)

Install dependencies with `npm install`, then run tests with `npm test`.

## Project Structure <a name = "project_structure"></a>

```
/
└───fcore/              # Functional Core
│   |   .puretest.js    # Helper function
│   └───examples/       # Example modules
└───ishell/             # Imperative Shell
│   └───index.js        # App entry point
└───tests/              # Tests
    └───fcore-puretests/
    └───fcore-unit-tests/
    └───ishell-integration-tests/
```

## Functional Core <a name = "fcore"></a>

Every module file in `fcore/` must include _only_ **pure functions**. If this rule is broken, the tests in `tests/fcore-puretests` when running `npm test` will fail.

### Definition of "Pure Function" <a name = "purefunc"></a>

**The Strict Definition:**

A function is pure if it:

1. Consistently returns the same result, when called with the same arguments.

2. Produces no side-effects outside of itself.

3. Relies on no external state.

4. Calls no external function.

A more **Relaxed Definition** would switch **4.** to:

4. Calls no _impure_ function.

The so-called "pure tests" will not enforce **1.**, but they will attempt to enforce **2.**, **3.**, and **4.**

Function _expressions_ will follow the _stricter_ definition, while function _declarations_ will follow the _relaxed_ definition:

```js
const foo = (a) => a + 1;   // pure

// Function declaration
function bar(a) {
  // still pure, by relaxed definition
  return foo(a);
}

// Function expression
const baz = (a) => {
  // impure, by strict definition
  return foo(a);
}

function boo(a) {   // impure
    return baz(a);  // calls impure function
}
```

### Registering Methods with `puretest` <a name = "registering"></a>

For the "pure tests" to work properly, every `module.exports` object _must_ include a property `_puretests`, that calls the `puretest` helper function to register each module method, like so:

```js
function add(a, b) {
  return a + b;
}

// defined in fcore/.puretest.js:
const puretest = require(".puretest");

module.exports = {
  add,
  _puretests: puretest(add, 1, 1) // add(1, 1)
};
```

When the tests run, they will call `add(1, 1)` to determine whether the function is pure. Any module methods _not_ registered will be ignored by the tests. See [How the "Pure Tests" Work](#puretests) for more details.

The `puretest` helper function can be chained to register multiple test cases, like so:

```js
module.exports = {
  add,
  _puretests: 
    puretest(add, 1, 1)     // add(1, 1)
    .puretest(add, 2, 4)    // add(2, 4)
    .puretest(add, 7, 5),   // add(7, 5)
};
```

More importantly, this allows multiple module methods to be registered:

```js
module.exports = {
  add,
  subtract,
  multiply,
  _puretests:
    puretest(add, 1, 1)         // add(1, 1)
    .puretest(subtract, 8, 3)   // subtract(8, 3)
    .puretest(multiply, 3, 10)  // multiply(3, 10)
};
```

### Ignored Files

Any file (or whole sub-directories) within `fcore/` whose name starts with a dot `.` will be ignored by the "pure tests".

In particular, `fcore/examples/.impure_functions` contains examples of impure functions. Try renaming this directory to `impure_functions` (without the dot `.` ), and then run `npm test` to observe the error messages.

## Imperative Shell <a name = "ishell"></a>

`ishell/` is the home of the app entry point `index.js`, and unlike `fcore/` can hold any effectful, stateful, impure code which can interface with any external dependencies.

According to the "FCIS" pattern, one should attempt to extract _most_ of the logic out of `ishell/` and into `fcore/`, to keep this as thin a _shell_ as possible.

## The Approach to Testing <a name = "testing"></a>

By extracting most of the logic into `fcore/`, the bulk of the tests one writes will be unit tests of pure functions (in `tests/fcore-unit-tests`), with only a _few_ integration tests for the simple, non-branching `ishell/` "adapter" code (in `tests/ishell-integration-tests`).

Since pure functions do not rely on external dependencies, there is no need to use _test doubles_ (i.e. mocks and stubs). Technically, pure functions can use dependencies injected as parameters, but this technique should be used sparingly, since it is difficult to guarantee that these dependencies are "non-effectful" (nor do the "pure tests" check for this).

For more about this approach, see:

- ["Boundaries" talk by Gary Bernhardt](https://www.youtube.com/watch?v=eOYal8elnZk)
- ["Integration Tests are a Scam" talk by J. B. Rainsberger](https://www.youtube.com/watch?v=VDfX44fZoMc)
- [No Mocks Testing](https://github.com/kbilsted/Functional-core-imperative-shell/blob/master/README.md#2-test-isolation---nomock)

That is really all you need to know to begin using this project. The rest of this document is not necessary to read, unless you wish to learn more about how the "pure tests" work.

## How the "Pure Tests" Work

There are two tests in `fcore-puretests.test.js`.

The first runs the methods registered via `puretest` in an isolated VM sandbox, and if no `ReferenceError` is thrown, it passes. In a nutshell.

The second runs the methods through the [is-pure-function](https://www.npmjs.com/package/is-pure-function) npm package.

### Running in Sandbox

The first test uses the technique described in the article ["Test if a function is pure"](https://glebbahmutov.com/blog/test-if-a-function-is-pure-revisited/) by Gleb Bahmutov, that calls `vm.runInContext` with the function's source code to run in an isolated context.

In addition, the function body's code block is rewritten to be wrapped in a closure (in strict mode) to prevent leaving any traces even in the sandbox (this rewriting is done with `falafel`, and the re-written files are stored in `fcore/.rewrite/`). The code that performs the rewrite is in `rewrite.js`. For more details, see the article.

However, the initial technique proposed did not allow for calling external pure functions (as in the relaxed definition). Thus, the algorithm had to be extended to make this possible.

This gist of the algorithm is that, in the first round, strictly pure functions that pass the test are remembered. Then, in the second iteration, for the other functions which threw a `ReferenceError` when they tried to call said pure functions, they are rewritten again with said pure function injected into its sandbox so it can be invoked successfully the next time around. This cycle is repeated until no new pure functions are found.

At the end, all of the registered "pure tests" are run again, and if they all run in isolation without errors, the test passes.

Note that this test completely ignores function _expressions_ (which the second test rectifies).

### The is-pure-function package

The second test uses this package only for function _expressions_ (and not function _declarations_) because it enforces the strict definition of no external dependencies.
