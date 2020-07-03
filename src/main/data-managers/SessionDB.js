/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const DatabaseAdapter = require('./DatabaseAdapter');
const Reportable = require('./Reportable');
const { ErrorMessages, RequestError } = require('../errors/RequestError');
const { mostRecentlyCreated, resolveOrReject } = require('../utils/db');

// The ID & data properties documented for the API request
const sessionUidField = 'uuid';
const sessionDataField = 'data';

/**
 * @extends DatabaseAdapter
 */
class SessionDB extends Reportable(DatabaseAdapter) {
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
      // Reject if any session is missing its UUID or data fields. Uses same check as nedb.
      // Requiring UUID ensures uniqueness; removing this check would provide a fallback for clients
      // to import data without caring about uniqueness.
      // Requiring a nested data field ensures metadata is kept separate.
      const isInvalid = s => s[sessionUidField] === undefined || s[sessionDataField] === undefined;
      if (sessions.some(isInvalid)) {
        reject(new RequestError(`'${sessionUidField}' and '${sessionDataField}' required on session`));
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
   * Find all sessions for a protocol.
   * The default projection returns only limited data to speed up query.
   */
  findAll(protocolId, limit = null, projection = { updatedAt: 1, createdAt: 1, 'data.sessionVariables': 1 }, sort = mostRecentlyCreated, filterValue = '') {
    return new Promise((resolve, reject) => {
      const exp = new RegExp(filterValue);
      let cursor = this.db.find({ protocolId, $or: [{ 'data.sessionVariables._caseID': exp }, { _id: exp }] }, projection || undefined);
      cursor = cursor.sort(sort);
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
    if (!protocolId) {
      return Promise.reject(new Error(`Invalid protocol ID (${protocolId})`));
    }
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

  // Delete (destroy) all session data for all protocols
  // TODO: Probably remove after alpha testing
  deleteAll() {
    return new Promise((resolve, reject) => {
      this.db.remove({}, { multi: true }, resolveOrReject(resolve, reject));
    });
  }
}

module.exports = SessionDB;
