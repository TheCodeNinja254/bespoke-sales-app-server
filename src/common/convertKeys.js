const isPlainObject = require('lodash/isPlainObject');
const camelCase = require('lodash/camelCase');
const keys = require('lodash/keys');
const isEmpty = require('lodash/isEmpty');

const convertKeys = (data) => {
  // handle simple types
  if (!isPlainObject(data) && !Array.isArray(data)) {
    return data;
  }

  if (isPlainObject(data) && !isEmpty(data)) {
    const keysToConvert = keys(data);
    keysToConvert.forEach((key) => {
      data[camelCase(key)] = convertKeys(data[key]);

      // remove snake_case key
      if (camelCase(key) !== key) {
        delete data[key];
      }
    });
  }

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      data[index] = convertKeys(item);
    });
  }

  return data;
};

module.exports = convertKeys;
