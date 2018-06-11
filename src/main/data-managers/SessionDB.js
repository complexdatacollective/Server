/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const DatabaseAdapter = require('./DatabaseAdapter');

// The property name used as a UUID by the client
const sessionUidField = 'uid';

class SessionDB extends DatabaseAdapter {
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
}

module.exports = SessionDB;
