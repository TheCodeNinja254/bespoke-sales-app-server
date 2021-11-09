/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const Logger = require('../logging');

// this function is purely to get the algorithm to use in encryption and decryption
const getAlgorithm = (keyPassed) => {
  const key = Buffer.from(keyPassed, 'base64');
  switch (key.length) {
    case 16:
      return 'aes-128-cbc';
    case 32:
      return 'aes-256-cbc';
  }
  const customerMessage = "invalid key passed";
  const technicalMessage = `Invalid key length: ${key.length}`;
  Logger.log(
    'error',
    'Error: ',
    {
      customerMessage,
      request: 'getAlgorithm',
      actualError: technicalMessage,
      fullError: technicalMessage,
    },
  );
  throw new Error(`Invalid key length: ${key.length}`);
};

module.exports = getAlgorithm;
