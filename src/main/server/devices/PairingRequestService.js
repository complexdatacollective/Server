/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const NeDB = require('nedb');
const uuidv4 = require('uuid/v4');
const libsodium = require('libsodium-wrappers');
const logger = require('electron-log');

const PairingCodeFactory = require('./PairingCodeFactory');
const { RequestError } = require('../../errors/RequestError');

const DeviceRequestTTLSeconds = 5 * 60;

const dbConfig = {
  corruptAlertThreshold: 0,
  // TODO: review in-mem/on-disk and document.
  // Notes on persistence:
  //    0. We want to store the pairing passcode, which is sensitive.
  //    1. Auto-expiration is only triggered by a query
  //    2. nedb uses an append-only format; until compaction happens, data is still on disk.
  //    3. Therefore, if sensitive data is on disk, we must periodically expire & compact.
  //       setAutocompactionInterval() is insufficient
  // With in-memory, closing the app will cancel the pairing process.
  inMemoryOnly: true,
  // filename: path.join(dataDir, DeviceRequestDbName),
  // autoload: true,
  timestampData: true,
};

// TODO: Move nacl-related code
function deriveSecret(pairingCode, salt) {
  // FIXME: Find a reasonable mem limit that doesn't error (16777216 errors locally)
  // libsodium.crypto_pwhash_MEMLIMIT_MIN == 8192
  // libsodium.crypto_pwhash_MEMLIMIT_INTERACTIVE == 67108864
  // With the latter (recommended), getting error; may need custom compilation step:
  //    Cannot enlarge memory arrays. ...
  const memlimit = 16777216 / 2;
  // crypto_pwhash_ALG_ARGON2ID13 is the default as of libsodium 0.7.3;
  // for algo upgrades, we'll need a pairing upgrade process.
  const algo = libsodium.crypto_pwhash_ALG_ARGON2ID13;
  const keyLen = libsodium.crypto_box_SECRETKEYBYTES;
  const secretKey = libsodium.crypto_pwhash(keyLen,
    pairingCode, salt, libsodium.crypto_pwhash_OPSLIMIT_INTERACTIVE, memlimit, algo);
  return secretKey;
}

class PairingRequestService {
  constructor() {
    this.db = new NeDB(dbConfig); // eslint-disable-line new-cap

    this.db.ensureIndex({
      fieldName: 'createdAt',
      expireAfterSeconds: DeviceRequestTTLSeconds,
    }, (err) => {
      if (err) { logger.error(err); }
    });
  }

  // Pairing code is the shared secret.
  createRequest() {
    return new Promise((resolve, reject) => {
      PairingCodeFactory.generatePairingCodeAsync()
        .then((pairingCode) => {
          // TODO: evaluate. I was using the request ID as something like a salt.
          // ...Probably use this instead; don't need both?
          const salt = libsodium.randombytes_buf(libsodium.crypto_pwhash_SALTBYTES);
          const secretKey = deriveSecret(pairingCode, salt);

          // TODO: avoiding serialization is preferable; how is that handled with db?
          this.db.insert({
            salt: libsodium.to_hex(salt),
            secretKey: libsodium.to_hex(secretKey),
            pairingCode,
            used: false,
            _id: uuidv4(),
          }, (err, newRequest) => {
            if (err) {
              // TODO: retry?
              reject(err);
            } else {
              logger.info('New pairing request saved', newRequest._id, pairingCode);
              resolve(newRequest);
            }
          });
        })
        .catch(err => reject(err));
    });
  }

  /**
   * Checks for a valid (matching, unexpired) pairing request and, if found,
   * mark it as used so that it can't be used again.
   * @async
   * @param {string} requestId ID of a pairing request from createRequest()
   * @param {string} pairingCode alphanumeric code, entered by user
   * @return {Object} the pairing request, containing a secret key, to be used for device creation
   * @throws {RequestError} If no matching request is found
   */
  verifyAndExpireRequest(requestId, pairingCode) {
    const errMsg = 'Request verification failed';
    return new Promise((resolve, reject) => {
      if (!requestId || !pairingCode) {
        reject(new RequestError(errMsg));
        return;
      }

      const query = { _id: requestId, pairingCode, used: false };
      const updateClause = { $set: { used: true } };
      const opts = { multi: false, returnUpdatedDocs: true };

      this.db.update(query, updateClause, opts, (err, num, doc) => {
        if (err) {
          // Assume error on our side
          logger.error(err);
          reject(err);
        } else if (!doc) {
          // Pairing request was invalid or expired
          reject(new RequestError(errMsg));
        } else {
          resolve(doc);
        }
      });
    });
  }
}

// function __exampleSymmetricCrypt__(secret) {
//   // example encryption...
//   const message = 'Network Canvas Server';
//   const nonce = libsodium.randombytes_buf(libsodium.crypto_secretbox_NONCEBYTES);
//   const cipher = libsodium.crypto_secretbox_easy(message, nonce, secret);

//   // nonce can be sent in the clear, so here's the entire message:
//   const noncePlusCipher = new Uint8Array(nonce.length + cipher.length);
//   noncePlusCipher.set(nonce);
//   noncePlusCipher.set(cipher, nonce.length);

//   // see API docs: https://github.com/jedisct1/libsodium.js
//   const minLength = libsodium.crypto_secretbox_NONCEBYTES + libsodium.crypto_secretbox_MACBYTES;
//   if (noncePlusCipher.length < minLength) {
//     throw new Error('Message too short');
//   }

//   // example decryption...
//   const receivedNonce = noncePlusCipher.slice(0, libsodium.crypto_secretbox_NONCEBYTES);
//   const receivedCipher = noncePlusCipher.slice(libsodium.crypto_secretbox_NONCEBYTES);
//   const retrievedBytes = libsodium.crypto_secretbox_open_easy(receivedCipher,
//     receivedNonce, secret);
//   const retrievedMessage = libsodium.to_string(retrievedBytes);

//   return retrievedMessage === message;
// }

module.exports = {
  PairingRequestService,
};
