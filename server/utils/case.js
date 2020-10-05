const camelCase = require('lodash/camelCase');

module.exports.camelizeKeys = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map((v) => this.camelizeKeys(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [camelCase(key)]: this.camelizeKeys(obj[key]),
      }),
      {}
    );
  }
  return obj;
};
