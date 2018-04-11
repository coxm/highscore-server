const uglify = require('uglify-es');


const scoreLength = len => len => 23000 / Math.sqrt(
  60 + 7 * len + 0.5 * len * len + 0.05 * len * len * len)


const evaluate = proof => {
  if (typeof proof !== 'string') {
    return {error: 'Invalid proof', value: 0};
  }
  const result = uglify.minify(proof);
  if (result.error) {
    return {error: 'Unable to process proof code', value: 0};
  }
  return {error: '', value: scoreLength(result.code.length)};
};
module.exports.evaluate = evaluate;
