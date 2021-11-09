// Require the core node modules.
const crypto = require("crypto");
const config = require('dotenv');
const Logger = require('./logging');

config.config();
const configValues = process.env;

const encryptionKey = configValues.ENCRYPTION_KEY;
const initializationVector = configValues.INITIALIZATION_VECTOR;

// The CipherIV methods must take the inputs as a binary / buffer values.
const binaryEncryptionKey = Buffer.from(encryptionKey, "base64");
const binaryIV = Buffer.from(initializationVector, "base64");

module.exports = {
  encrypt(input) {
    try {
      const cipher = crypto.createCipheriv("AES-128-CBC", binaryEncryptionKey, binaryIV);

      // When encrypting, we're converting the UTF-8 input to base64 output.
      return (
        cipher.update(input, "utf8", "base64")
          + cipher.final("base64")
      );
    } catch (e) {
      const customerMessage = 'Wrong format passed.';
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'encrypt',
          // input,
          technicalMessage: `Unable to encrypt the input`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  },

  decrypt(encryptedText) {
    try {
      const decipher = crypto.createDecipheriv("AES-128-CBC", binaryEncryptionKey, binaryIV);

      // When decrypting we're converting the base64 input to UTF-8 output.
      return (
        decipher.update(encryptedText, "base64", "utf8")
          + decipher.final("utf8")
      );
    } catch (e) {
      const customerMessage = 'Wrong format passed.';
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'decrypt',
          // input: encryptedText,
          technicalMessage: `Unable to decrypt the input`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  },
};
