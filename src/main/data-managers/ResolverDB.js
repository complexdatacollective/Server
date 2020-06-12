const DatabaseAdapter = require('./DatabaseAdapter');
const { ErrorMessages, RequestError } = require('../errors/RequestError');
const { mostRecent, resolveOrReject } = require('../utils/db');

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
  insertResolution(protocolId, parameters, transforms) {
    return new Promise((resolve, reject) => {
      if (!protocolId) {
        reject(new RequestError(ErrorMessages.NotFound));
        return;
      }

      const doc = {
        protocolId,
        parameters,
        transforms,
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

  find(query) {
    return new Promise((resolve, reject) => {
      this.db.find(query).sort(mostRecent).exec(resolveOrReject(resolve, reject));
    });
  }

  getResolutions(protocolId) {
    const query = protocolId ? { protocolId } : {};
    return this.find(query);
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
