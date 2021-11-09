/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const getPermissionsString = (value) => {
  let string = 'read';
  if (value === 0) {
    string = 'createReadDelete';
  }
  if (value === 1) {
    string = 'createRead';
  }
  return string;
};

module.exports = getPermissionsString;
