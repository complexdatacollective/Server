/* eslint-disable no-underscore-dangle */

const fs = require('fs');
const path = require('path');
const logger = require('electron-log');

const SessionDB = require('./SessionDB');
const { archive } = require('../utils/archive');
const { RequestError, ErrorMessages } = require('../errors/RequestError');
const { makeTempDir, removeTempDir } = require('../utils/formatters/dir');
const {
  filterNetworkEntities,
  filterNetworksWithQuery,
  unionOfNetworks,
} = require('../utils/formatters/network');
const {
  formatsAreValid,
  getFileExtension,
  getFormatterClass,
} = require('../utils/formatters/utils');

/**
 * Export a single (CSV or graphml) file
 * @param  {string} namePrefix
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
const exportFile = (
  namePrefix,
  exportFormat,
  outDir,
  network,
  { useDirectedEdges, variableRegistry } = {},
) => {
  const Formatter = getFormatterClass(exportFormat);
  const extension = getFileExtension(exportFormat);
  if (!Formatter || !extension) {
    return Promise.reject(new RequestError(`Invalid export format ${exportFormat}`));
  }

  let streamController;
  let writeStream;

  const pathPromise = new Promise((resolve, reject) => {
    const formatter = new Formatter(network, useDirectedEdges, variableRegistry);
    const filepath = path.join(outDir, `${namePrefix}.${exportFormat}${extension}`);
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
   *                                 Options: ["adjacencyMatrix", "attributeList", "edgeList"]
   * @param {boolean} options.exportNetworkUnion true if all interview networks should be merged
   *                                             false if each interview network should be exported
   *                                             individually
   * @param {Object} options.filter before formatting, apply this filter to each network (if
   *                                `exportNetworkUnion` is false) or the merged network (if
   *                                `exportNetworkUnion` is true)
   * @param {Object} networkFilter a user-supplied filter configuration which will be run on each
   *                               member of each network, to filter out unwanted nodes & edges.
   * @param {Object} networkInclusionQuery a user-supplied query configuration which will be run on
   *                                       each interview's network to determine if it should be
   *                                       exported
   * @param {boolean} options.useDirectedEdges used by the formatters. May be removed in the future
   *                                           if information is encapsulated in network.
   * @return {Promise} A `promise` that resloves to a filepath (string). The promise is decorated
   *                     with an `abort` function to support request cancellations.
   *                     If the export is aborted, then the returned promise will never settle.
   * @return {string} filepath of written file
   */
  createExportFile(
    protocol,
    {
      destinationFilepath,
      exportFormats,
      exportNetworkUnion,
      entityFilter,
      networkInclusionQuery,
      useDirectedEdges,
    } = {},
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }
    if (!destinationFilepath || !formatsAreValid(exportFormats) || !exportFormats.length) {
      return Promise.reject(new RequestError(ErrorMessages.InvalidExportOptions));
    }

    let tmpDir;
    const cleanUp = () => removeTempDir(tmpDir);

    let promisedExports;
    const exportOpts = {
      useDirectedEdges,
      variableRegistry: protocol.variableRegistry,
    };

    // Export flow:
    // 1. fetch all networks produced for this protocol's interviews
    // 2. optional: run user query to select networks are exported
    // 3. optional: merge all networks into a single union for export
    // 4. optional: filter each network based on user-supplied rules
    // 5. [TODO: #199] optional: insert ego with edges into each network
    // 6. export each format for each network
    // 7. save ZIP file to requested location
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
      .then(allNetworks => filterNetworksWithQuery(allNetworks, networkInclusionQuery))
      .then(networks => (exportNetworkUnion ? [unionOfNetworks(networks)] : networks))
      .then(networks => filterNetworkEntities(networks, entityFilter))
      .then((filteredNetworks) => {
        // TODO: evaluate & test. It'll be easier to track progress when run concurrently,
        // but this may run into memory issues.
        promisedExports = flatten(
          filteredNetworks.map((network, i) =>
            exportFormats.map(format =>
              exportFile(`${i + 1}`, format, tmpDir, network, exportOpts))));
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
      cleanUp();
    };

    return exportPromise;
  }
}

module.exports = ExportManager;
