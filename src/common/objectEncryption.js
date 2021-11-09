const crypto = require('crypto');

const password = '123456789Subreg!';
const iv = 'ssshhhhhhhhhhh!!';

function sha1(input) {
  return crypto.createHash('sha1').update(input).digest();
}

// eslint-disable-next-line camelcase
function password_derive_bytes(password, salt, iterations, len) {
  let key = Buffer.from(password + salt);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < iterations; i++) {
    key = sha1(key);
  }
  if (key.length < len) {
    const hx = password_derive_bytes(password, salt, iterations - 1, 20);
    // eslint-disable-next-line no-plusplus
    for (let counter = 1; key.length < len; ++counter) {
      key = Buffer.concat([key, sha1(Buffer.concat([Buffer.from(counter.toString()), hx]))]);
    }
  }
  return Buffer.alloc(len, key);
}

module.exports = {
  async encodeObject(string) {
    const key = password_derive_bytes(password, '', 100, 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.from(iv));
    const part1 = cipher.update(string, 'utf8');
    const part2 = cipher.final();
    return Buffer.concat([part1, part2]).toString('base64');
  },

  async decode(string) {
    const key = password_derive_bytes(password, '', 100, 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv));
    let decrypted = decipher.update(string, 'base64', 'utf8');
    decrypted += decipher.final();
    return decrypted;
  },
};
