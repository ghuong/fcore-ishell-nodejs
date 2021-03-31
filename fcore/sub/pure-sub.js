const add = require("../add/pure-add").add;

function sub(a, b) {
  return add(a, -b); // calls pure add!
}

module.exports = {
  sub,
  _purityTests: () => [
    () => {
      sub(2, 3);
      return sub;
    },
  ]
};
