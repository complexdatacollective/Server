/* eslint-disable no-underscore-dangle */
const path = require('path');
const logger = require('electron-log');
const FileExportManager = require('../utils/network-exporters');

const SessionDB = require('./SessionDB');
const { RequestError, ErrorMessages } = require('../errors/RequestError');


/**
 * Interface for all data exports
 */
class ExportManager {
  constructor(sessionDataDir) {
    // TODO: path is duplicated in ProtocolManager
    const sessionDbFile = path.join(sessionDataDir, 'db', 'sessions.db');
    this.sessionDB = new SessionDB(sessionDbFile);
  }

  /**
   * Produces one or more export files, zips them up if needed, writes the results to a
   * temporary location, and returns [a promise resolving to] the filepath.
   *
   * @async
   * @param {Object} protocol the saved protocol from DB
   * @param {string} options.destinationFilepath local FS path to output the final file
   * @param {Array<string>} options.exportFormats
   *        Possible values: "adjacencyMatrix", "attributeList", "edgeList", "ego", "graphml"
   * @param {Array} options.csvTypes if `exportFormat` is "csv", then include these types in output.
   *                                Options: ["adjacencyMatrix", "attributeList", "edgeList", "ego"]
   * @param {boolean} options.exportNetworkUnion true if all interview networks should be merged
   *                                             false if each interview network should be exported
   *                                             individually
   * @param {boolean} options.useDirectedEdges used by the formatters. May be removed in the future
   *                                           if information is encapsulated in network.
   * @return {Promise} A `promise` that resloves to a filepath (string). The promise is decorated
   *                     with an `abort` function to support request cancellations.
   *                     If the export is aborted, then the returned promise will never settle.
   * @return {string} filepath of written file
   */
  exportSessions(
    protocol,
    options,
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }

    const exportPromise = this.sessionDB.findAll(protocol._id, null, null)
      .then();

    return exportPromise;
  }
}

module.exports = ExportManager;
