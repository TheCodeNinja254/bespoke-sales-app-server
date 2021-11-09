const { createLogger, format } = require('winston');
const DailyLog = require('winston-daily-rotate-file');
const _ = require('lodash');
const getTimeStamp = require("./getTimestamp");

const {
  combine, timestamp, label, printf,
} = format;


const logStringBuilder = (meta, message, level) => {
  let logString = `${getTimeStamp()}|message=${message}|level=${level}`;

  if ('url' in meta) {
    logString = `${logString}|url=${meta.url}`;
    delete meta.url;
  }

  if ('request' in meta) {
    logString = `${logString}|request=${meta.request}`;
    delete meta.request;
  }

  if ('email' in meta) {
    logString = `${logString}|email=${meta.email}`;
    delete meta.email;
  }

  if ('technicalMessage' in meta) {
    logString = `${logString}|technicalMessage=${meta.technicalMessage}`;
    delete meta.technicalMessage;
  }

  // Add customer error
  const selectableErrors = ['customerMessage', 'customError', 'message', 'actualError', 'systemError'];
  const pipeSpecial = (errors) => {
    _.forOwn(errors, (value, key) => {
      if (typeof value === 'object') {
        pipeSpecial(value);
      } else if (selectableErrors.indexOf(key) >= 0) {
        logString = `${logString}|${key} =${value}`;
      }
    });
  };
  pipeSpecial(meta);

  logString = `${logString}|more=${JSON.stringify(meta)}\n`;

  return logString;
};

const timezoned = () => new Date().toLocaleString('en-US', {
  timeZone: 'Africa/Nairobi',
});

const logFormat = printf(({ level, message, ...meta }) => (`${logStringBuilder(meta, message, level)}`));
// const logFilePath = 'logs/safaricom-home4G-development-%DATE%.log';
const logFilePath = '/opt/Home4G/Server/logs/safaricom-home4G-development-%DATE%.log';

const logger = createLogger({
  transports: [
    new DailyLog({
      filename: logFilePath,
      datePattern: 'YYYY-MM-DD',
    }),
  ],
  format: combine(
    label({ label: 'Home 4G Node Server' }),
    timestamp({
      format: timezoned,
    }),
    logFormat,
  ),
});

module.exports = logger;
