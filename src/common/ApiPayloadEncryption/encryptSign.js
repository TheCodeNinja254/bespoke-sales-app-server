// this function encrypt and signs the text
const crypto = require('crypto');
const encrypt = require('./encrypt');
const Logger = require('../logging');
const macSign = require('./macSign');

const encryptSign = (ikm, info, authenticationTag, plainText) => {
  /*
    * needs four params
     */
  const iv = crypto.randomBytes(16);
  try {
    const cipherText = encrypt(plainText, iv, ikm, info); // cipher text returned which is now base 64
    const signedCipher = macSign(ikm, authenticationTag, cipherText);
    // after signing serialize the response by appending the length of the IV, the IV, the length of the mac, the mac and the encrypted data
    const macBuffer = Buffer.from(signedCipher, 'base64');
    const cipherTextBuffer = Buffer.from(cipherText, 'base64');
    Logger.log(
      'error',
      'Error ',
      {
        customerMessage: 'Encryption done',
        request: 'encryptSign (APiPayloadEncryption)',
        actualError: 'Nil',
        encryptedPayload: Buffer.concat([
          Buffer.alloc(1, iv.length), iv,
          Buffer.alloc(1, macBuffer.length),
          macBuffer,
          cipherTextBuffer])
          .toString('base64'),
      },
    );
    return Buffer.concat([
      Buffer.alloc(1, iv.length), iv,
      Buffer.alloc(1, macBuffer.length),
      macBuffer,
      cipherTextBuffer])
      .toString('base64');
  } catch (e) {
    const customerMessage = "Unable to encrypt";
    Logger.log(
      'error',
      'Error ',
      {
        customerMessage,
        request: 'encryptSign (APiPayloadEncryption)',
        actualError: e,
        fullError: e,
      },
    );
    throw new Error("Unable to encrypt");
  }
};

module.exports = encryptSign;
