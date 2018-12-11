/* eslint-disable no-underscore-dangle */

const fs = require('fs');
const path = require('path');
const uuid = require('uuid');
const logger = require('electron-log');

const SessionDB = require('./SessionDB');
const { archive } = require('../utils/archive');
const { writeFile } = require('../utils/promised-fs');
const { RequestError, ErrorMessages } = require('../errors/RequestError');
const { unionOfNetworks } = require('../utils/formatters/network');
const { makeTempDir } = require('../utils/formatters/dir');
const {
  formats,
  formatsAreValid,
  getFileExtension,
  getFormatterClass,
} = require('../utils/formatters/utils');

/**
 * Export a single (CSV or graphml) file
 * @param  {formats} exportFormat
 * @param  {string} outDir directory where we should write the file
 * @param  {object} network NC-formatted network `({ nodes, edges })`
 * @param  {object} [options]
 * @param  {boolean} [options.useDirectedEdges=false] true to force directed edges
 * @param  {Object} [options.variableRegistry] needed for graphML export
 * @return {Promise} promise decorated with an `abort` method.
 *                           If aborted, the returned promise will never settle.
 * @private
 */
const exportFile = (exportFormat, outDir, network, { useDirectedEdges, variableRegistry } = {}) => {
  const Formatter = getFormatterClass(exportFormat);
  const extension = getFileExtension(exportFormat);
  if (!Formatter || !extension) {
    return Promise.reject(new RequestError(`Invalid export format ${exportFormat}`));
  }

  let streamController;
  let writeStream;

  // Temporary support for graphml string interface
  if (exportFormat === formats.graphml) {
    const formatter = new Formatter(network, variableRegistry); // TODO: unify interface
    const filepath = path.join(outDir, `${uuid()}${extension}`);
    return writeFile(filepath, formatter.toString()).then(() => filepath);
  }

  const pathPromise = new Promise((resolve, reject) => {
    const formatter = new Formatter(network, useDirectedEdges);
    const filepath = path.join(outDir, `${uuid()}${extension}`);
    writeStream = fs.createWriteStream(filepath);
    writeStream.on('finish', () => { resolve(filepath); });
    writeStream.on('error', (err) => { reject(err); });
    // TODO: on('ready')?
    logger.debug(`Writing ${exportFormat} file ${filepath}`);
    streamController = formatter.writeToStream(writeStream);
  });

  pathPromise.abort = () => {
    if (streamController) {
      streamController.abort();
    }
    if (writeStream) {
      writeStream.destroy();
    }
  };

  return pathPromise;
};

const flatten = shallowArrays => [].concat(...shallowArrays);

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
   * @param {string} options.exportFormat "csv" or "graphml"
   * @param {Array} options.csvTypes if `exportFormat` is "csv", then include these types in output.
   *                                 Options: ["adjacencyMatrix", "adjacencyList", "attributeList"]
   * @param {boolean} options.exportNetworkUnion true if all interview networks should be merged
   *                                             false if each interview network should be exported
   *                                             individually
   * @param {Object} options.filter before formatting, apply this filter to each network (if
   *                                `exportNetworkUnion` is false) or the merged network (if
   *                                `exportNetworkUnion` is true)
   * @param {boolean} options.useDirectedEdges used by the formatters. May be removed in the future
   *                                           if information is encapsulated in network.
   * @return {Promise} A `promise` that resloves to a filepath (string). The promise is decorated
   *                     with an `abort` function to support request cancellations.
   *                     If the export is aborted, then the returned promise will never settle.
   * @return {string} filepath of written file
   */
  createExportFile(
    protocol,
    { destinationFilepath, exportFormats, exportNetworkUnion, useDirectedEdges/* , filter */ } = {},
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }
    if (!destinationFilepath || !formatsAreValid(exportFormats) || !exportFormats.length) {
      return Promise.reject(new RequestError(ErrorMessages.InvalidExportOptions));
    }

    let tmpDir;
    const cleanUp = () => {
      try {
        // TODO: clean up all our temp files
        // const outDirPrefix = tmpDir.substring(0, tmpDir.length - 6);
        // if (tmpDir && (new RegExp(`${tmpDirPrefix}$`).test(outDirPrefix))) {
        // fs.rmdirSync(tmpDir);
        // }
      } catch (err) { /* don't throw; cleanUp is called after catching */ }
    };

    let promisedExports;
    const exportOpts = {
      useDirectedEdges,
      variableRegistry: protocol.variableRegistry,
    };

    const exportPromise = makeTempDir()
      .then((dir) => {
        tmpDir = dir;
        if (!tmpDir) {
          throw new Error('Temporary directory unavailable');
        }
      })
      .then(() => this.sessionDB.findAll(protocol._id, null, null))
      // TODO: may want to preserve some session metadata for naming?
      .then(sessions => sessions.map(session => session.data))
      .then(networks => (exportNetworkUnion ? [unionOfNetworks(networks)] : networks))
      .then((networks) => {
        // TODO: evaluate & test. It'll be easier to track progress when run concurrently,
        // but this may run into memory issues.
        promisedExports = flatten(
          networks.map(network =>
            exportFormats.map(format =>
              exportFile(format, tmpDir, network, exportOpts))));
        return Promise.all(promisedExports);
      })
      // TODO: check length; if 0: reject, if 1: don't zip?
      .then(exportedPaths => archive(exportedPaths, destinationFilepath))
      .catch((err) => {
        cleanUp();
        logger.error(err);
        throw err;
      })
      .then(cleanUp);

    exportPromise.abort = () => {
      if (promisedExports) {
        promisedExports.forEach(promise => promise.abort());
      }
    };

    return exportPromise;
  }
}

module.exports = ExportManager;
