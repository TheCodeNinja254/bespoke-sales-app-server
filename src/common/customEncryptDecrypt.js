// Require the core node modules.
const crypto = require("crypto");
const config = require('dotenv');
const Logger = require('./logging');

config.config();
const configValues = process.env;

const encryptionKey = configValues.IPRS_ENCRYPTION_KEY;
const initializationVector = configValues.IPRS_INITIALIZATION_VECTOR;

// The CipherIV methods must take the inputs as a binary / buffer values.
const binaryEncryptionKey = Buffer.from(encryptionKey, "base64");
const binaryIV = Buffer.from(initializationVector, "base64");

module.exports = {
  CustEncrypt(input) {
    // const MyJSON = Buffer.from(JSON.stringify(input));
    try {
      const cipher = crypto.createCipheriv("AES-128-CBC", binaryEncryptionKey, binaryIV);

      // When encrypting, we're converting the UTF-8 input to base64 output.
      return (
        Buffer.concat([cipher.update(Buffer.from(JSON.stringify(input), "utf8")), cipher.final("base64")])
      );
    } catch (e) {
      const customerMessage = 'Wrong format passed.';
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'encrypt',
          input,
          technicalMessage: `Unable to encrypt the input`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  },
};
