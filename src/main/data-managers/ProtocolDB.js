/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const crypto = require('crypto');
const logger = require('electron-log');

const DatabaseAdapter = require('./DatabaseAdapter');
const { ErrorMessages, RequestError } = require('../errors/RequestError');

class ProtocolDB extends DatabaseAdapter {
  /**
   * Insert or update protocol metadata.
   * For now, we're overwriting files, so filenames are unique. Upsert based on filename.
   * @param  {string} baseFilename filename of the protocol container (e.g., example.netcavas)
   * @param  {Buffer} rawFileData used to calculate a checksum
   * @param  {Object} metadata parsed properties form the protocol file
   * @param  {string} metadata.name
   * @param  {string} metadata.version
   * @param  {string} metadata.networkCanvasVersion
   * @return {Object} the persisted metadata
   * @throws If DB save fails
   */
  save(baseFilename, rawFileData, protocol) {
    return new Promise((resolve, reject) => {
      if (!baseFilename || !protocol) {
        reject(new RequestError(ErrorMessages.InvalidFile));
        return;
      }

      const { name, version, networkCanvasVersion = '' } = protocol;

      this.db.update({
        filename: baseFilename,
      }, {
        filename: baseFilename,
        name,
        version,
        networkCanvasVersion,
        sha256: crypto.createHash('sha256').update(rawFileData).digest('hex'),
      }, {
        multi: false,
        upsert: true,
        returnUpdatedDocs: true,
      }, (dbErr, count, doc) => {
        if (dbErr || !count) {
          reject(new RequestError(ErrorMessages.InvalidFile));
        } else {
          logger.debug('Saved metadata for', baseFilename);
          resolve(doc);
        }
      });
    });
  }

  /**
   * Get a list of all protocol metadata
   * @async
   * @return {Array<Object>} all persisted protocol data
   * @throws {Error}
   */
  all() {
    return new Promise((resolve, reject) => {
      this.db.find({}).sort({ createdAt: -1 }).exec((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }

  /**
   * Delete a protocol with the given ID
   * @async
   * @param {Object} protocol
   * @return {number} 1 if successful; 0 if unsuccessful
   * @throws {Error} If a DB error occurred
   */
  destroy(protocol) {
    return new Promise((resolve, reject) => {
      if (!protocol._id) { reject(new Error('Cannot delete protocol without an id')); }
      this.db.remove({ _id: protocol._id }, { multi: false }, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve(numRemoved);
        }
      });
    });
  }

  /**
   * Get the first protocol matching the query
   * @async
   * @param {Object} query
   * @return {Object} a persisted protocol
   * @throws {Error}
   */
  first(query) {
    return new Promise((resolve, reject) => {
      this.db.findOne(query, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
    });
  }

  /**
   * Get the protocol matching ID
   * @async
   * @param {Object} id
   * @return {Object} a persisted protocol
   * @throws {Error}
   */
  get(id) {
    return this.first({ _id: id });
  }
}

module.exports = ProtocolDB;
