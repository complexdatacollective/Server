/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const { DateTime } = require('luxon');
const DatabaseAdapter = require('./DatabaseAdapter');
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
class ResolverDB extends DatabaseAdapter {
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
  insertResolutions(protocolId, command, params, resolutions) {
    return new Promise((resolve, reject) => {
      if (!protocolId) {
        reject(new RequestError(ErrorMessages.NotFound));
        return;
      }

      // save current date
      const date = DateTime.local().toISO();

      this.db.insert({
        protocolId,
        date,
        command,
        params,
        resolutions,
      }, (err, docs) => {
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
