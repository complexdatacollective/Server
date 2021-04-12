const crypto = require('crypto');

const hexDigest = (input) => crypto.createHash('sha256').update(input).digest('hex');

module.exports = {
  hexDigest,
};
