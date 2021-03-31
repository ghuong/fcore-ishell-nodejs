var add = require("../add/pure-add");
function sub(a, b) {
  return add(a, -b); // calls pure add!
}
module.exports = sub;
