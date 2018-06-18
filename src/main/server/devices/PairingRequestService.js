/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const NeDB = require('nedb');
const uuidv4 = require('uuid/v4');
const logger = require('electron-log');

const PairingCodeFactory = require('./PairingCodeFactory');
const { ErrorMessages, RequestError } = require('../../errors/RequestError');
const {
  decrypt,
  deriveSecretKeyBytes,
  newSaltBytes,
  fromHex,
  toHex,
} = require('../../utils/shared-api/cipher');

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

  // Pairing code is used to derive a shared secret.
  createRequest() {
    return new Promise((resolve, reject) => {
      PairingCodeFactory.generatePairingCodeAsync()
        .then((pairingCode) => {
          const saltBytes = newSaltBytes();
          const secretKeyBytes = deriveSecretKeyBytes(pairingCode, saltBytes);

          this.db.insert({
            salt: toHex(saltBytes),
            secretKey: toHex(secretKeyBytes),
            pairingCode,
            used: false,
            _id: uuidv4(),
          }, (err, newRequest) => {
            if (err) {
              // TODO: retry?
              reject(err);
            } else {
              logger.info('New pairing request saved', newRequest._id);
              resolve(newRequest);
            }
          });
        })
        .catch(err => reject(err));
    });
  }

  verifyAndExpireEncryptedRequest(messageHex) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ used: false }).sort({ createdAt: -1 }).exec((err, doc) => {
        if (err || !doc) {
          reject(new RequestError(ErrorMessages.VerificationFailed));
        }
        let plaintext;
        let json;
        try {
          // FIXME: if decryption fails, should we expire request immediately?
          const secretBytes = deriveSecretKeyBytes(doc.pairingCode, fromHex(doc.salt));
          plaintext = decrypt(messageHex, toHex(secretBytes));
        } catch (decipherErr) {
          // This could be from either derivation or decryption
          logger.debug(decipherErr);
          reject(new RequestError(ErrorMessages.DecryptionFailed));
          return;
        }
        try {
          json = JSON.parse(plaintext);
        } catch (parseErr) {
          reject(new RequestError(ErrorMessages.InvalidRequestBody));
          return;
        }
        this.verifyAndExpireRequest(json.pairingRequestId, json.pairingCode, json.deviceName)
          .then(resolve)
          .catch(reject);
      });
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
  verifyAndExpireRequest(requestId, pairingCode, deviceName) {
    const errMsg = 'Request verification failed';
    return new Promise((resolve, reject) => {
      if (!requestId || !pairingCode) {
        reject(new RequestError(errMsg));
        return;
      }

      const query = { _id: requestId, pairingCode, used: false };
      const updateClause = { $set: { used: true, deviceName } };
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

module.exports = {
  PairingRequestService,
};
