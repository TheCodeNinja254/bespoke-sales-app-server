// this function is to macSign a string
const crypto = require('crypto');
const { generateHkdfKey } = require('./generateHkdfKey');

const macSign = (ikm, info, cipherText) => {
  /* macSign function needs three parameters
    * ikm the initial keying material to be used in generating the hkdf authentication key
    * info parameter also to be used in generating the hkdf authentication key
    * cipherText which is the string you need to decrypt
    */

  // get the hkdf authentication key
  const hkdfAuthenticationKey = generateHkdfKey(ikm, 32, null, info); // by default it will use SHA-256 and will return a buffer
  const cipherTextBuffer = Buffer.from(cipherText, 'base64');
  // return the base 64 of the signed string
  return crypto.createHmac('sha256', hkdfAuthenticationKey).update(cipherTextBuffer).digest('base64');
};

module.exports = macSign;
