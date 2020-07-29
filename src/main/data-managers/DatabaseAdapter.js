const NeDB = require('nedb');
const { mostRecentlyCreated, resolveOrReject } = require('../utils/db');

const DbConfig = {
  corruptAlertThreshold: 0,
  inMemoryOnly: false,
  autoload: true,
  timestampData: true,
};

/**
 * An abstract class wrapping NeDB instances.
 *
 * Methods return promises.
 *
 * If a name is given (for either on-disk or in-mem DBs), this ensures DB
 * access uses the same underlying DB instance, as NeDB does not support concurrent
 * client initialization.
 */
class DatabaseAdapter {
  static dbClient(dbName, config = {}) {
    if (!this.dbClients) {
      this.dbClients = {};
    }
    if (!this.dbClients[dbName]) {
      const dbConfig = { ...DbConfig, ...config };
      if (!dbConfig.inMemoryOnly) {
        dbConfig.filename = dbName;
      }
      this.dbClients[dbName] = new NeDB(dbConfig);
    }
    return this.dbClients[dbName];
  }

  /**
   * @constructor
   * @param  {string} dbName name of file (e.g., 'protocols.db'), or a unique name for in-mem DB
   *                         If a name is not supplied, DB will not be shared across instances;
   *                         this is probably the desired behavior for tests.
   *                         If name is empty, inMemoryOnly will be forced to true.
   * @param  {Object} additionalConfig See nedb docs
   * @param  {Boolean} additionalConfig.inMemoryOnly=false
   * @param  {Boolean} additionalConfig.autoload=true
   * @param  {Boolean} additionalConfig.timestampData=true
   * @param  {Boolean} additionalConfig.corruptAlertThreshold=0
   * @throws {Error}
   */
  constructor(dbName, additionalConfig = {}) {
    if (!dbName) {
      this.db = new NeDB({ ...DbConfig, ...additionalConfig, inMemoryOnly: true });
    } else {
      this.db = this.constructor.dbClient(dbName, { ...DbConfig, ...additionalConfig });
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
      this.db.find({}).sort(mostRecentlyCreated).exec(resolveOrReject(resolve, reject));
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
