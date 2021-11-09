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
