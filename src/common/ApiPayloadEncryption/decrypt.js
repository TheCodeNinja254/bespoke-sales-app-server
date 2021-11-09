// this function is purely to get the plain Text of an encrypted string
// for now we will return it as base 64
const crypto = require('crypto');
const Logger = require('../logging');
const getAlgorithm = require('./getAlgorithm');
const { generateHkdfKey } = require('./generateHkdfKey');

const decrypt = (cipherText, ivParam, ikm, info) => {
  /* decrypt function needs four parameters
    * cipherText which is the string you need to decrypt
    * ivParam which is the iv generated
    * ikm the initial keying material to be used in generating the hkdf encryption key
    * info parameter also to be used in generating the hkdf encryption key
    */

  // get the hkdf encryption key
  const encryptionHkdfKey = generateHkdfKey(ikm, 16, null, info); // by default it will use SHA-256 and will return a buffer
  const key = Buffer.from(encryptionHkdfKey, 'base64');
  const iv = Buffer.from(ivParam, 'base64');
  // let's decrypt the plain text
  try {
    const decipher = crypto.createDecipheriv(getAlgorithm(encryptionHkdfKey), key, iv);
    let decrypted = decipher.update(cipherText, 'base64');
    decrypted += decipher.final();
    return decrypted;
  } catch (e) {
    const customerMessage = "Unable to decrypt";
    Logger.log(
      'error',
      'Error ',
      {
        customerMessage,
        request: 'decrypt (APiPayloadEncryption)',
        actualError: e,
        fullError: e,
      },
    );
    throw new Error(customerMessage);
  }
};

module.exports = decrypt;
