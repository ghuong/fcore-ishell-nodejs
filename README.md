# fcore-ishell-nodejs

## About <a name = "about"></a>

A template Node app enforcing "Functional Core, Imperative Shell" pattern.

## Getting Started <a name = "getting_started"></a>

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See [deployment](#deployment) for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them.

```
Give examples
```

### Installing

A step by step series of examples that tell you how to get a development env running.

Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo.

## Usage <a name = "usage"></a>

The directory structure is as follows:

```
/
└───fcore/              # Functional Core
└───ishell/             # Imperative Shell
│   └───index.js        # App entry point
└───tests/
    └───fcore/          # Isolated (unit) tests for fcore functions _without_ test doubles
    └───fcore-purity/   # Tests whether all fcore modules are "pure"
    └───ishell/         # Integrated tests for ishell functions
```

### Pure Functions

A function is pure if:

1. When called with the same arguments, it returns the same result.

2. Produces no side-effects outside of itself.

3. Relies on no external state.
