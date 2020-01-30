/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const DatabaseAdapter = require('./DatabaseAdapter');
const Reportable = require('./Reportable');
const { ErrorMessages, RequestError } = require('../errors/RequestError');

// protocolID
// {string} date (auto)
// {object} resolver exe
// {object} resolver params
// {string} raw output of entity resolver
// {string} transform selected transforms

/**
 * @extends DatabaseAdapter
 */
class ResolverDB extends Reportable(DatabaseAdapter) {
  /**
   *
   * @param {Object} protocol (known to exist in DB) containing an _id
   * @param {object} resolverPath path to resolver
   * @param {object} resolverParams resolver params
   * @param {string} result raw output of entity resolver
   * @param {string} transforms selected transforms (based on result + user input)
   * @async
   * @return {Array} saved sessions
   * @throws {RequestError|Error}
   */
  insertSnapshot(protocolId, resolverPath, resolverParams, result, transforms) {
    return new Promise((resolve, reject) => {
      if (!protocolId) {
        reject(new RequestError(ErrorMessages.NotFound));
        return;
      }

      this.db.insert({
        protocolId,
        resolverPath,
        resolverParams,
        result,
        transforms,
      }, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }
}

module.exports = ResolverDB;
