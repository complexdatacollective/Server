const crypto = require('crypto');

// Character set with confusing chars removed (from https://www.grc.com/ppp.htm),
// with two modifications:
// - '=' is two taps away on Android keyboard; replace with '&'
// - '!' is two away on iOS (if you don't know swipe-down-on-key); replace with '/'
const generatePairingCodeAsync = () => new Promise((resolve, reject) => {
  const passcodeLength = 12;
  const charSet = '#%&+/23456789:?@ABCDEFGHJKLMNPRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('');
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
