const crypto = require('crypto');

// TODO: real code generation.
// - Length? Range? Excluded chars (e.g. O/0)?
// - library to handle this?
const generatePairingCodeAsync = () => {
  return new Promise((resolve, reject) => {
    const passcodeLength = 12;
    const chars = [];
    const charSet = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789-+'.split('');
    if (256 % charSet.length !== 0) {
      throw new Error('length will not provide normal distribution');
    }

    const buffer = new Uint8Array(passcodeLength);
    crypto.randomFill(buffer, (err, buf) => {
      if (err) { return reject(err); }

      let passcode = '';
      buf.forEach(n => passcode += charSet[n % charSet.length]);
      resolve(passcode);
    });
  });
}

module.exports = {
  generatePairingCodeAsync,
};
