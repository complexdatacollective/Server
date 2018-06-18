/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const logger = require('electron-log');

const DatabaseAdapter = require('./DatabaseAdapter');
const { ErrorMessages, RequestError } = require('../errors/RequestError');

// Name is the unique identifier for a protocol.
// This normalizes unicode points, but leaves otherwise unchanged
// (any characters, including unprintable, are valid).
const normalizedName = protocol => protocol.name && protocol.name.normalize();

// lastModified is optional, but if supplied must be a valid date string after 1970
const validatedModifyTime = (protocol) => {
  const datetime = protocol.lastModified;
  const timestamp = Date.parse(datetime);
  if (isNaN(timestamp) || timestamp < 0) {
    return undefined;
  }
  return datetime;
};

/**
 * @class
 */
class ProtocolDB extends DatabaseAdapter {
  /**
   * Insert or update protocol metadata.
   * The value of the "name" property in the JSON metadata is used to uniquely identify a protocol.
   * @param  {string} filename base name of the protocol container (e.g., example.netcavas)
   * @param  {Buffer} sha256Digest checksum for file contents
   * @param  {Object} metadata parsed properties form the protocol JSON file
   * @param  {string} metadata.name required and used as a unique key
   * @param  {string?} metadata.description
   * @param  {string?} metadata.networkCanvasVersion
   * @param  {Object?} opts
   * @param  {boolean} [opts.returnOldDoc=false] if true, returns both the old doc and new doc.
   * @async
   * @return {Object} Resolve with the persisted metadata. If opts.returnOldDoc was true, this is
   *                          an object of the shape { prev: {}, curr: {} }.
   * @throws If DB save fails
   */
  save(filename, sha256Digest, metadata, { returnOldDoc = false } = {}) {
    return new Promise(async (resolve, reject) => {
      if (!filename || !sha256Digest) {
        reject(new RequestError(ErrorMessages.InvalidContainerFile));
        return;
      }

      if (!metadata) {
        reject(new RequestError(`${ErrorMessages.InvalidProtocolFormat}: empty protocol`));
        return;
      }

      const name = normalizedName(metadata);
      if (!name) {
        reject(new RequestError(`${ErrorMessages.InvalidProtocolFormat}: "name" is required`));
        return;
      }

      const { description, networkCanvasVersion = '' } = metadata;
      const lastModified = validatedModifyTime(metadata);

      let oldDoc;
      if (returnOldDoc) {
        oldDoc = await this.first({ name });
      }

      this.db.update({
        name,
      }, {
        name,
        filename,
        description,
        lastModified,
        networkCanvasVersion,
        sha256Digest,
      }, {
        multi: false,
        upsert: true,
        returnUpdatedDocs: true,
      }, (dbErr, count, doc) => {
        if (dbErr || !count) {
          reject(dbErr || new Error('Save failed'));
        } else {
          logger.debug('Saved metadata for', filename);
          if (returnOldDoc) {
            resolve({
              prev: oldDoc,
              curr: doc,
            });
          } else {
            resolve(doc);
          }
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
