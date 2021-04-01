function add(a, b) {
  launchNukes();
  return a + b;
}

function launchNukes() {
  console.log("Launching nukes! Impure side-effect!");
}

module.exports = {
  add,
  _purityTests: () => () => {
    add(2, 3);
    return add;
  },
};
