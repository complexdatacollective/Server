/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const DatabaseAdapter = require('./DatabaseAdapter');
const { ErrorMessages, RequestError } = require('../errors/RequestError');
const { mostRecent, resolveOrReject } = require('../utils/db');

// The property name used as a UUID by the client
const sessionUidField = 'uuid';

/**
 * @class
 */
class SessionDB extends DatabaseAdapter {
  /**
   * Persist one or more sessions for a protocol.
   * This method takes a protocol object rather than ID; the caller must verify that
   * the protocol exists in a DB.
   * @param {Array|Object} sessionOrSessions one or more sessions
   * @param {Object} protocol (known to exist in DB) containing an _id
   * @async
   * @return {Array} saved sessions
   * @throws {RequestError|Error}
   */
  insertAllForProtocol(sessionOrSessions, protocol) {
    return new Promise((resolve, reject) => {
      if (!protocol || !protocol._id) {
        reject(new RequestError(ErrorMessages.NotFound));
        return;
      }
      const isArray = sessionOrSessions instanceof Array;
      let sessions = isArray ? sessionOrSessions : [sessionOrSessions];
      // Reject if any session is missing its unique ID. Uses same check as nedb.
      // This ensures uniqueness; removing this check would provide a fallback for clients
      // to import data without caring about uniqueness.
      if (sessions.some(s => s[sessionUidField] === undefined)) {
        reject(new RequestError(`'${sessionUidField}' property is required on session`));
        return;
      }
      sessions = sessions.map(s => (
        // Use client-provided uid for PK; nedb drops field if undefined.
        { ...s, _id: s[sessionUidField], [sessionUidField]: undefined, protocolId: protocol._id }
      ));
      this.db.insert(sessions, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }

  /**
   * Find all sessions for a protocol
   */
  findAll(protocolId, limit = null) {
    // For now, return only limited data to speed query
    const projection = { updatedAt: 1 };
    return new Promise((resolve, reject) => {
      let cursor = this.db.find({ protocolId }, projection).sort(mostRecent);
      if (limit) { cursor = cursor.limit(limit); }
      cursor.exec((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }

  /**
   * Delete (destroy) one or more sessions associated with a protocol
   */
  delete(protocolId, sessionId = null) {
    const query = { protocolId };
    const opts = { multi: true };
    if (sessionId) {
      query._id = sessionId;
      opts.multi = false;
    }
    return new Promise((resolve, reject) => {
      this.db.remove(query, opts, resolveOrReject(resolve, reject));
    });
  }
}

module.exports = SessionDB;
