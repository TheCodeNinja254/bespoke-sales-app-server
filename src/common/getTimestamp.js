/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const getTimeStamp = () => {
  const now = new Date();
  return (`${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}T${now.getHours()}:${
    (now.getMinutes() < 10) ? (`0${now.getMinutes()}`) : (now.getMinutes())}:${(now.getSeconds() < 10) ? (`0${now
    .getSeconds()}`) : (now.getSeconds())}`);
};

module.exports = getTimeStamp;
