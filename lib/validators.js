const validInputString = /[-_.@a-zA-Z0-9]+/;
const isValidInputString = str => validInputString.test(str);


const numeric = value => {
  value = +value;
  return {valid: !Number.isNaN(value), value};
};
module.exports.numeric = numeric;


const integer = value => {
  value = +value;
  return {valid: value === (value|0), value};
};
module.exports.integer = integer;


const positiveInteger = value => {
  value = +value;
  return {valid: value > 0 && value === (value|0), value};
};
module.exports.positiveInteger = positiveInteger;


const string = value => ({valid: isValidInputString(value), value});
module.exports.string = string;


module.exports.player = module.exports.string;
