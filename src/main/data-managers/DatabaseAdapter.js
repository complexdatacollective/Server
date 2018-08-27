const NeDB = require('nedb');
const { mostRecent, resolveOrReject } = require('../utils/db');

const DbConfig = {
  corruptAlertThreshold: 0,
  inMemoryOnly: false,
  autoload: true,
  timestampData: true,
};

class DatabaseAdapter {
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

  /**
   * Get the first document matching the query
   * @async
   * @param {Object} query
   * @return {Object|null} the matching document, or null if not found
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
   * Get the document matching ID
   * @async
   * @param {string} id
   * @return {Object|null} the document, or null if not found
   * @throws {Error}
   */
  get(id) {
    return this.first({ _id: id });
  }

  /**
   * Insert a record into the DB
   * @async
   * @param  {Object} data document to insert
   * @return {Object} the inserted document
   * @throws {Error} if DB error or document returned from DB is null
   */
  create(data) {
    return new Promise((resolve, reject) => {
      this.db.insert(data, (err, doc) => {
        if (err || !doc) {
          reject(err || new Error('Insert failed'));
        } else {
          resolve(doc);
        }
      });
    });
  }
}

module.exports = DatabaseAdapter;
