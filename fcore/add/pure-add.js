function add(a, b) {
  return a + b;
}

module.exports = {
  add,
  _purityTests: () => () => {
    add(2, 3);
    return add;
  },
};
