function isArray(arr) {
  return Array.isArray(arr); // using existing global variable
}

module.exports = {
  isArray,
  _puretests: () => () => {
    isArray([1, 2, 5]);
    return isArray;
  },
};
