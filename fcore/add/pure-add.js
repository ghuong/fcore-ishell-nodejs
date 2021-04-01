function add(a, b) {
  return a + b;
}

function add5(a) {
  return a + 5;
}

function add10(a) {
  return add(a, 10); // call to pure function
}

module.exports = {
  add,
  add5,
  add10,
  _purityTests: () => [
    () => {
      add(2, 3);
      return add;
    },
    () => {
      add5(10);
      return add5;
    },
    () => {
      add10(4);
      return add10;
    }
  ]
};
