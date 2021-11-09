const crypto = require('crypto');
const config = require('dotenv');
const Logger = require('../../common/logging');

config.config();
const configValues = process.env;

const algorithm = 'aes-256-cbc';
const salt = configValues.IPRS_INITIALIZATION_VECTOR;
const digest = 'sha256';

module.exports = {
  payloadEncrypt(plainText, secretKey) {
    try {
      const key = crypto.pbkdf2Sync(secretKey, salt, 65536, 32, digest);
      const iv = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

      const cipher = crypto.createCipheriv(algorithm, key, iv);
      let encrypted = cipher.update(plainText, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      Logger.log(
        'success',
        'Success: ',
        {
          request: 'payloadEncrypt',
          technicalMessage: `Unable to encrypt the input`,
          customerMessage: "Encryption Successful",
        },
      );
      return encrypted;
    } catch (e) {
      const customerMessage = 'Wrong format passed.';
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'payloadEncrypt',
          technicalMessage: `Unable to encrypt the input`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  },

  payloadDecrypt(strToDecrypt, secretKey) {
    try {
      const key = crypto.pbkdf2Sync(secretKey, salt, 65536, 32, digest);
      const iv = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      let decrypted = decipher.update(strToDecrypt, 'base64');
      decrypted += decipher.final();
      Logger.log(
        'success',
        'Success: ',
        {
          request: 'payloadDecrypt',
          technicalMessage: `Unable to decrypt the input`,
          customerMessage: "Decryption Successful",
        },
      );
      return decrypted;
    } catch (e) {
      const customerMessage = 'Wrong format passed.';
      Logger.log(
        'error',
        'Error: ',
        {
          fullError: e,
          request: 'payloadDecrypt',
          technicalMessage: `Unable to decrypt the input`,
          customerMessage,
        },
      );
      throw new Error(customerMessage);
    }
  },
};
