const NeDB = require('nedb');
const { mostRecent, resolveOrReject } = require('../utils/db');

const DbConfig = {
  corruptAlertThreshold: 0,
  inMemoryOnly: false,
  autoload: true,
  timestampData: true,
};

class DatabaseAdapter {
  // TODO: See comments at DeviceManager.dbClient
  static dbClient(filename, config = {}) {
    if (!this.dbClients) {
      this.dbClients = {};
    }
    if (!this.dbClients[filename]) {
      this.dbClients[filename] = new NeDB({ ...DbConfig, ...config, filename });
    }
    return this.dbClients[filename];
  }

  /**
   * @constructor
   * @param  {string} dbFile name of file (e.g., 'protocols.db')
   * @param  {Boolean} [inMemoryOnly=false] useful for testing
   */
  constructor(dbFile, inMemoryOnly = false, additionalConfig = {}) {
    if (inMemoryOnly) {
      this.db = new NeDB({ ...DbConfig, inMemoryOnly, ...additionalConfig });
    } else {
      this.db = this.constructor.dbClient(dbFile, additionalConfig);
    }
  }

  /**
   * Get a list of all documents
   * @async
   * @return {Array<Object>} all persisted data
   * @throws {Error}
   */
  all() {
    return new Promise((resolve, reject) => {
      this.db.find({}).sort(mostRecent).exec(resolveOrReject(resolve, reject));
    });
  }
}

module.exports = DatabaseAdapter;
