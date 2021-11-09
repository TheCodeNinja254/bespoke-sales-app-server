/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */

const crypto = require('crypto');

const hashString = (string) => crypto.createHash('md5').update(string).digest('hex');

module.exports = hashString;
