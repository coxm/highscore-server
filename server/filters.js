/** All relations offered by the API. */
const relationMap = {
  lt: '<',
  gt: '>',
  lte: '<=',
  gte: '>=',
  eq: '=',
  neq: '<>',
};
module.exports.relationMap = relationMap;


/** Construct a filter description from a key-value pair. */
const construct = (key, value, allowedFilters) => {
  const split = key.split('__');
  if (split.length > 2) {
    return {error: `Ill-formed parameter: ${key}`, where: null};
  }
  if (split.length === 1) {
    split.push('eq');
  }

  const field = split[0];
  const relnName = split[1];
  const op = relationMap[relnName];
  if (!op) { // Invalid relation code.
    return {error: `Invalid relation name: ${relnName}`, field, op, value};
  }
  const fieldFilters = allowedFilters[field];
  if (!fieldFilters) { // Invalid field.
    return {error: `Can't filter on ${field}`, field, op, value};
  }
  if (!fieldFilters.relations.includes(relnName)) { // Invalid reln for field.
    return {error: `Can't filter ${field} with ${relnName}`, field, op, value};
  }
  if (!fieldFilters.valid(value)) { // Invalid value for this field.
    return {
      error: `Can't filter ${field} ${relnCode} ${value}`,
      field, op, value,
    };
  }
  return {error: '', field, op, value};
};
module.exports.construct = construct;


/** Aggregate a query parameters dict into a function for filtering queries. */
const aggregate = (params, allowedFilters) => {
  const filters = [];
  for (const key in params) {
    const filter = construct(key, params[key], allowedFilters);
    if (filter.error) {
      return {error: filter.error, filter: null};
    }
    filters.push(filter);
  }
  return {
    error: '',
    filter(builder) {
      for (const filter of filters) {
        builder = builder.andWhere(filter.field, filter.op, filter.value);
      }
      return builder;
    },
  };
};
module.exports.aggregate = aggregate;
