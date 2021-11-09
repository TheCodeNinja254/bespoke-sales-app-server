// generate a hkdf key
const hkdf = require('futoin-hkdf');

module.exports = {
  /*
    * ikm inital keying material
    * length of the key needed
    * salt optional, can be null
    * info optional, can be empty
    * hash to use. By default we have SHA-256
     */
  generateHkdfKey(ikm, length, salt, info = '', hash = "SHA-256") {
    // return a buffer key
    return hkdf(ikm, length, { salt, info, hash });
  },
};
