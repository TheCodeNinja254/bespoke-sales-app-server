const config = require('dotenv').config();

const configValues = config.parsed;
const getMsisdn = (headers) => {
  let msisdn = "";
  if (headers['x-jinny-cid']) {
    msisdn = headers['x-jinny-cid'];
  } else if (headers['x-jinny.cid']) {
    msisdn = headers['x-jinny.cid'];
  } else if (headers['x-nokia-msisdn']) {
    msisdn = headers['x-nokia-msisdn'];
  } else if (headers['x-up-calling-line-id']) {
    msisdn = headers['x-up-calling-line-id'];
  } else if (headers['X-Jinny.cid']) {
    msisdn = headers['X-Jinny.cid'];
  }
  if (configValues.ALLOW_MOCK && configValues.ALLOW_MOCK === 'true') {
    msisdn = configValues.MOCK_NUMBER;
  }
  return msisdn;
};

module.exports = getMsisdn;
