const crypto = require('crypto');

// TODO: real code generation.
// - Length? Range? Excluded chars (e.g. O/0)?
// - library to handle this?
const generatePairingCodeAsync = () => new Promise((resolve, reject) => {
  const passcodeLength = 12;
  const charSet = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789-+'.split('');
  if (256 % charSet.length !== 0) {
    throw new Error('length will not provide normal distribution');
  }

  const buffer = new Uint8Array(passcodeLength);
  crypto.randomFill(buffer, (err, buf) => {
    if (err) {
      reject(err);
      return;
    }

    let passcode = '';
    buf.forEach((byte) => {
      passcode += charSet[byte % charSet.length];
    });
    resolve(passcode);
  });
});

module.exports = {
  generatePairingCodeAsync,
};
