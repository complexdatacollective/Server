const logger = require('electron-log');
const DatabaseAdapter = require('./DatabaseAdapter');
const { ErrorMessages, RequestError } = require('../errors/RequestError');
const { leastRecentlyCreated, resolveOrReject } = require('../utils/db');

const missingRequiredIdMessage = 'Cannot delete resolution without a protocol id and resolution id';

/**
 * @extends DatabaseAdapter
 */
class ResolverDB extends DatabaseAdapter {
  /**
   *
   * @param {Object} protocol (known to exist in DB) containing an _id
   * @param {object} options resolver and export params
   * @param {Array} transforms selected transforms (based on result + user input)
   * @async
   * @return {Array} saved resolutions
   * @throws {RequestError|Error}
   */
  insertResolution(protocolId, resolution) {
    return new Promise((resolve, reject) => {
      if (!protocolId) {
        reject(new RequestError(ErrorMessages.NotFound));
        return;
      }

      const doc = {
        protocolId,
        ...resolution,
      };

      this.db.insert(doc, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }

  find(...args) {
    return new Promise((resolve, reject) => {
      this.db.find(...args).sort(leastRecentlyCreated).exec(resolveOrReject(resolve, reject));
    });
  }

  getResolutions(protocolId, resolutionId = null) {
    if (!resolutionId) {
      return this.find({ protocolId });
    }

    // Get resolutions up to and including resolutionId
    return this.find({ _id: resolutionId }, { createdAt: 1 })
      .then(([{ createdAt }]) => {
        return this.find({ $where: function beforeDate() {
          return this.createdAt <= createdAt;
        } });
      });
  }

  deleteProtocolResolutions(protocolId) {
    return new Promise((resolve, reject) => {
      if (!protocolId) { reject(new Error(missingRequiredIdMessage)); }

      this.db.remove(
        { protocolId },
        { multi: true },
        resolveOrReject(resolve, reject),
      );
    });
  }

  deleteResolution(resolutionId) {
    return new Promise((resolve, reject) => {
      if (!resolutionId) { reject(new Error(missingRequiredIdMessage)); }
      this.db.remove(
        { _id: resolutionId },
        { multi: false },
        resolveOrReject(resolve, reject),
      );
    });
  }

  deleteResolutions(resolutionIds) {
    return new Promise((resolve, reject) => {
      if (!resolutionIds) { reject(new Error(missingRequiredIdMessage)); }
      this.db.remove(
        { $or: resolutionIds.map(_id => ({ _id })) },
        { multi: true },
        resolveOrReject(resolve, reject),
      );
    });
  }
}

module.exports = ResolverDB;
