const fs = require('fs');
const os = require('os');
const path = require('path');
const uuid = require('uuid');
const logger = require('electron-log');

const tmpDirPrefix = 'org.codaco.server.exporting.';
const makeTempDir = () =>
  new Promise((resolve, reject) => {
    fs.mkdtemp(path.join(os.tmpdir(), tmpDirPrefix), (err, dir) => {
      if (err) {
        reject(err);
      } else {
        resolve(dir);
      }
    });
  });

const SessionDB = require('./SessionDB');
const {
  AdjacencyMatrixFormatter,
  AdjacencyListFormatter,
  AttributeListFormatter,
  GraphMLFormatter,
} = require('../utils/formatters');

const formats = {
  graphml: 'graphml',
  // CSV:
  adjacencyMatrix: 'adjacencyMatrix',
  adjacencyList: 'adjacencyList',
  attributeList: 'attributeList',
};

const unionOfNetworks = networks =>
  networks.reduce((union, network) => {
    union.nodes.push(...network.nodes);
    union.edges.push(...network.edges);
    return union;
  }, { nodes: [], edges: [] });

const getFormatterClass = (formatterType) => {
  switch (formatterType) {
    case formats.graphml:
      return GraphMLFormatter;
    case formats.adjacencyMatrix:
      return AdjacencyMatrixFormatter;
    case formats.adjacencyList:
      return AdjacencyListFormatter;
    case formats.attributeList:
      return AttributeListFormatter;
    default:
      return null;
  }
};

const getFileExtension = (formatterType) => {
  switch (formatterType) {
    case formats.graphml:
      return '.graphml';
    case formats.adjacencyMatrix:
    case formats.adjacencyList:
    case formats.attributeList:
      return '.csv';
    default:
      return null;
  }
};

const exportFile = (exportFormat, outDir, network, forceDirectedEdges) => {
  const Formatter = getFormatterClass(exportFormat);
  const extension = getFileExtension(exportFormat);
  if (!Formatter || !extension) {
    return Promise.reject(new Error(`Invalid export format ${exportFormat}`));
  }
  return new Promise((resolve, reject) => {
    const formatter = new Formatter(network, forceDirectedEdges);
    const filepath = path.join(outDir, `${uuid()}${extension}`);
    const writeStream = fs.createWriteStream(filepath);
    writeStream.on('finish', () => { resolve(filepath); });
    writeStream.on('error', (err) => { reject(err); });
    // TODO: on('ready')?
    logger.debug(`Writing ${exportFormat} file ${filepath}`);
    formatter.writeToStream(writeStream);
  });
};

const flatten = shallowArrays => [].concat(...shallowArrays);

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
   * @return {string} filepath of written file
   */
  createExportFile(
    protocolId,
    { exportFormats, exportNetworkUnion, useDirectedEdges/* , filter */ } = {},
  ) {
    let tmpDir;
    const cleanUp = () => {
      try {
        // TODO: clean up all our temp files
        const outDirPrefix = tmpDir.substring(0, tmpDir.length - 6);
        if (tmpDir && (new RegExp(`${tmpDirPrefix}$`).test(outDirPrefix))) {
          // fs.rmdirSync(tmpDir);
        }
      } catch (err) { /* don't throw; cleanUp is called after catching */ }
    };

    return makeTempDir()
      .then((dir) => {
        tmpDir = dir;
        if (!tmpDir) {
          throw new Error('Temporary directory unavailable');
        }
      })
      .then(() => this.sessionDB.findAll(protocolId, null, null))
      // TODO: may want to preserve some session metadata for naming?
      .then(sessions => sessions.map(session => session.data))
      .then(networks => (exportNetworkUnion ? [unionOfNetworks(networks)] : networks))
      .then(networks =>
        Promise.all(
          flatten(
            networks.map(network =>
              exportFormats.map(format =>
                exportFile(format, tmpDir, network, useDirectedEdges))))))
      .catch(err => logger.error(err))
      .then(cleanUp);
  }
}

module.exports = ExportManager;
