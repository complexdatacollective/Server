const uuid = require('uuid/v4');
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
        ...resolution,
        protocolId,
        uuid: uuid(),
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
      .then(([{ createdAt }]) => this.find({
        $where: function beforeDate() { return this.createdAt <= createdAt; },
      }));
  }

  /**
   * Delete any resolutions associated with a protocol
   *
   * @param {string} protocolId ID of related protocol
   */
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

  /**
   * Delete any resolutions after and including a certain date
   *
   * @param {string} protocolId ID of related protocol
   * @param {Date} date Target date for deletion
   */
  deleteResolutionsSince(protocolId, date) {
    return new Promise((done, reject) => {
      this.db.remove(
        { protocolId, createdAt: { $gte: date } },
        { multi: true },
        resolveOrReject(done, reject),
      );
    });
  }

  /**
   * Delete a specific resolution
   *
   * @param {string} resolutionId ID of resolution
   */
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
  /**
   * Delete a specific resolution
   *
   * @param {Array.<string>} resolutionIds An array of resolution Id strings
   */
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
