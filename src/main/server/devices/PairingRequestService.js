/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const uuidv4 = require('uuid/v4');
const logger = require('electron-log');
const { ipcMain } = require('electron');

const PairingRequestDB = require('../../data-managers/PairingRequestDB');
const PairingCodeFactory = require('./PairingCodeFactory');
const { ErrorMessages, RequestError } = require('../../errors/RequestError');
const {
  decrypt,
  deriveSecretKeyBytes,
  newSaltBytes,
  fromHex,
  toHex,
} = require('../../utils/shared-api/cipher');

class PairingRequestService {
  constructor() {
    this.sharedDb = new PairingRequestDB('PairingRequestDB');

    ipcMain.on('PAIRING_CANCELLED', (_, id) => {
      if (!id) { return; }
      this.cancelRequest(id);
    });
  }

  // Pairing code is used to derive a shared secret.
  createRequest() {
    return PairingCodeFactory.generatePairingCodeAsync()
      .then((pairingCode) => {
        const saltBytes = newSaltBytes();
        const secretKeyBytes = deriveSecretKeyBytes(pairingCode, saltBytes);
        return { pairingCode, saltBytes, secretKeyBytes };
      })
      .then(({ pairingCode, saltBytes, secretKeyBytes }) => (
        this.sharedDb.create({
          salt: toHex(saltBytes),
          secretKey: toHex(secretKeyBytes),
          pairingCode,
          used: false,
          _id: uuidv4(),
        })
      ));
  }

  verifyAndExpireEncryptedRequest(messageHex) {
    return new Promise((resolve, reject) => {
      this.sharedDb.db.findOne({ used: false }).sort({ createdAt: -1 }).exec((err, doc) => {
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
          // This could be from either derivation or decryption; by far the most likely
          // issue is a mis-typed pairing code.
          logger.debug(decipherErr);
          reject(new RequestError(ErrorMessages.InvalidPairingCode));
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

      this.sharedDb.db.update(query, updateClause, opts, (err, num, doc) => {
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

  /**
   * See if the pairing request is still available (unused and unexpired)
   * @async
   * @param  {string} requestId
   * @return {Object} the request, if it is still available;
   *                   false if it has expired, has been used, or is not found.
   * @throws {Error} If any DB error thrown
   */
  checkRequest(requestId) {
    return this.sharedDb.first({ _id: requestId, used: false });
  }

  cancelRequest(requestId) {
    return this.sharedDb.remove(requestId);
  }

  get deviceRequestTTLSeconds() {
    return this.sharedDb.deviceRequestTTLSeconds;
  }
}

module.exports = {
  PairingRequestService,
};
