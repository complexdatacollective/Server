/* eslint-disable no-underscore-dangle */
const path = require('path');
const { get } = require('lodash');
const logger = require('electron-log');
const fse = require('fs-extra');
const FileExportManager = require('../utils/network-exporters');
const ResolverManager = require('./ResolverManager');
const SessionDB = require('./SessionDB');
const { RequestError, ErrorMessages } = require('../errors/RequestError');

const sessionLogger = name =>
  (sessions) => {
    fse.writeFile(`/tmp/exports/session_${name}.json`, JSON.stringify(sessions[0], null, 2))
    return sessions;
  };

/**
 * Interface for all data exports
 */
class ExportManager {
  constructor(sessionDataDir) {
    // TODO: path is duplicated in ProtocolManager
    const sessionDbFile = path.join(sessionDataDir, 'db-6', 'sessions.db');
    this.sessionDB = new SessionDB(sessionDbFile);
    this.resolverManager = new ResolverManager(sessionDataDir);
  }

  getSessions(protocolId, options) {
    logger.info('resolutionid', options.resolutionId);

    if (options.resolutionId) {
      return this.resolverManager.getResolvedSessions(protocolId, options.resolutionId, undefined, false);
        // .then(sessionLogger('resolved'));
    }

    // Get all sessions associated with this protocol
    return this.sessionDB.findAll(protocolId, null, null)
      .then(sessions =>
        sessions.map(session => ({ ...session.data })),
      );
      // .then(sessionLogger('regular'));
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

    const exporter = this.getSessions(protocol._id, options)
      .then((sessions) => {
        // This is a valid assumption for Server, because we only ever export from within a
        // single protocol context - all sessions should have the same protocol.
        const protocolUID = get(sessions, '[0].sessionVariables.protocolUID');
        const protocols = { [protocolUID]: protocol };

        const fileExportManager = new FileExportManager(options);

        const exportSessions = () =>
          fileExportManager.exportSessions(sessions, protocols);

        return { exportSessions, fileExportManager };
      });

    return exporter;
  }
}

module.exports = ExportManager;
