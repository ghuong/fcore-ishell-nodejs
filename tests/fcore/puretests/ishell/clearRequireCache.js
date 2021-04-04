/**
 * Clear require cache to force reload of modules
 */
function clearRequireCache() {
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
}

module.exports = clearRequireCache;
