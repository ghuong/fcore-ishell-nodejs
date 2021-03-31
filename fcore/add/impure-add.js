function launchNukes() {}

function add(a, b) {
  launchNukes();
  return a + b;
}

module.exports = {
  add,
  _purityTests: () => () => {
    add(2, 3);
    return add;
  },
};
