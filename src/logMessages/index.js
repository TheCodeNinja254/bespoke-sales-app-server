const convertKeys = require('../common/convertKeys');
const Logger = require('../common/logging');
const ErrorHandler = require('../common/errorHandler');


const LogMessages = (response, callback, request, apiUrl, addedDetails = {}) => {
  const { header: { responseCode, responseMessage, customerMessage } } = convertKeys(response);
  if (responseCode === 200 || responseCode === 1000) {
    Logger.log(
      'info',
      'Success: ',
      {
        message: "Request Successful",
        request,
        addedDetails,
        callback,
        // response, // todo Only enabled for debugging otherwise disabled as a security requirement.
        url: apiUrl,
      },
    );
  } else {
    Logger.log(
      'error',
      'Error: ',
      {
        fullError: response, // Only enabled for debugging otherwise disabled as a security requirement.
        callback,
        addedDetails,
        response,
        customError: `Got (${responseCode}) while hitting ${apiUrl}`,
        actualError: responseMessage,
        customerMessage: ErrorHandler(customerMessage),
      },
    );
  }
};

module.exports = LogMessages;
