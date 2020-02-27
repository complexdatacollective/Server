const DatabaseAdapter = require('./DatabaseAdapter');
const { ErrorMessages, RequestError } = require('../errors/RequestError');

/**
 * @extends DatabaseAdapter
 */
class ResolverDB extends DatabaseAdapter {
  /**
   *
   * @param {Object} protocol (known to exist in DB) containing an _id
   * @param {object} options resolver and export params
   * @param {Array} resolutions selected transforms (based on result + user input)
   * @async
   * @return {Array} saved resolutions
   * @throws {RequestError|Error}
   */
  insertResolution(protocolId, options, resolutions) {
    return new Promise((resolve, reject) => {
      if (!protocolId) {
        reject(new RequestError(ErrorMessages.NotFound));
        return;
      }

      const doc = {
        protocolId,
        options,
        params: options,
        resolutions,
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

  getResolutions(protocolId) {
    // TODO: filter by id
    return this.all();
  }
}

module.exports = ResolverDB;
