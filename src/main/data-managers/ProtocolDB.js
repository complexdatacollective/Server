const NeDB = require('nedb');
const crypto = require('crypto');
const logger = require('electron-log');

const { ErrorMessages, RequestError } = require('../errors/RequestError');

const DbConfig = {
  inMemoryOnly: false,
  autoload: true,
  timestampData: true,
};

class ProtocolDB {
  // TODO: See comments at DeviceManager.dbClient
  static dbClient(filename) {
    if (!this.dbClients) {
      this.dbClients = {};
    }
    if (!this.dbClients[filename]) {
      this.dbClients[filename] = new NeDB({ ...DbConfig, filename });
    }
    return this.dbClients[filename];
  }

  /**
   * @constructor
   * @param  {string} dbFile name of file (e.g., 'protocols.db')
   * @param  {Boolean} [inMemoryOnly=false] useful for testing
   */
  constructor(dbFile, inMemoryOnly = false) {
    if (inMemoryOnly) {
      this.db = new NeDB({ ...DbConfig, inMemoryOnly });
    } else {
      this.db = ProtocolDB.dbClient(dbFile);
    }
  }

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
      this.db.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }
}

module.exports = ProtocolDB;
