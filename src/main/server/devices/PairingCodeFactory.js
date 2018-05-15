const crypto = require('crypto');

const { PairingCodeLength, CharacterSet } = require('../../utils/shared-api/pairingCodeConfig');

/**
 * Generate a random passcode that can be used for out-of-band pairing.
 *
 * Basic approach:
 * - Map possible byte values (0-255) evenly to the desired character set, wrapping around
 * - Discard all bytes above the highest byte that can map evenly
 * - For example, with character set [a-z]:
 *   - byte 0 maps to 'a'; byte 25 maps to 'z'
 *   - byte 26 maps to 'a'
 *   - bytes >= 234 are discarded, since they can't be mapped evenly (would favor early letters)
 *
 * You can estimate the entropy of a pairing code based on its character set and length:
 * `Math.log2(charSet.length ** PairingCodeLength)`.
 *
 * @async
 * @return {string} random pairing code
 * @throws {Error} Rejects if random code couldn't be created
 */
const generatePairingCodeAsync = () => new Promise((resolve, reject) => {
  const charSet = CharacterSet;
  const maxValidByte = 256 - (256 % charSet.length) - 1;

  let passcode = '';

  crypto.randomBytes(256, (err, buf) => {
    if (err) {
      reject(err);
      return;
    }

    for (const byte of buf) { // eslint-disable-line no-restricted-syntax
      if (byte <= maxValidByte) {
        const char = charSet[byte % charSet.length];
        if (!char) {
          // This would be programming/config error; throw unhandled
          throw new Error('Invalid passcode generation');
        }
        passcode += char;
        if (passcode.length === PairingCodeLength) {
          resolve(passcode);
          return;
        }
      }
    }

    reject(new Error('Could not generate long-enough passcode'));
  });
});

module.exports = {
  generatePairingCodeAsync,
};
