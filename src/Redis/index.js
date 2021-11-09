/*
 * Copyright (c) 2020.
 * Safaricom PLC
 * Systems, URLs, Databases and content in this document maybe proprietary to Safaricom PLC. Use or reproduction may require written permission from Safaricom PLC
 *
 */
const Redis = require('ioredis');
const config = require('dotenv').config();

const configValues = config.parsed;

const options = {
  host: configValues.REDIS_HOST || '127.0.0.1',
  port: configValues.REDIS_PORT || '6379',
  password: configValues.REDIS_PASSWORD || '',
  socket_keepalive: true,
  retry_strategy: (times) => {
    // reconnect after
    Math.min(times * 50, 2000);
  },
};

const redis = new Redis(options);

module.exports = {
  Redis,
  redis,
};
