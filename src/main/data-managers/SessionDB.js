/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const DatabaseAdapter = require('./DatabaseAdapter');
const { mostRecent, resolveOrReject } = require('../utils/db');

// The property name used as a UUID by the client
const sessionUidField = 'uid';

class SessionDB extends DatabaseAdapter {
  /**
   * Persist one or more sessions for a protocol.
   * This method takes a protocol object rather than ID; the caller should verify that
   * the protocol exists in a DB.
   * @param  {Array|Object} sessionOrSessions one or more sessions
   * @param  {Object} protocol (known to exist in DB) containing an _id
   * @async
   * @return {Array} saved sessions
   * @throws
   */
  insertAllForProtocol(sessionOrSessions, protocol) {
    return new Promise((resolve, reject) => {
      if (!protocol || !protocol._id) {
        reject(new Error('Missing protocol'));
        return;
      }
      const isArray = sessionOrSessions instanceof Array;
      let sessions = isArray ? sessionOrSessions : [sessionOrSessions];
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

  // TODO: review use cases: using projections can speed up dramatically
  findAll(protocolId) {
    return new Promise((resolve, reject) => {
      this.db.find({ protocolId }).sort(mostRecent).exec((err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }

  deleteAll(protocolId) {
    return new Promise((resolve, reject) => {
      this.db.remove({ protocolId }, { multi: true }, resolveOrReject(resolve, reject));
    });
  }
}

module.exports = SessionDB;
