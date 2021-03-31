function add(a, b) {
  console.log("impure side-effect!");
  return a + b;
}
module.exports = add;
