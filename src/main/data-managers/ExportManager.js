const fs = require('fs');
const path = require('path');
const uuid = require('uuid');

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

const exportFile = (exportFormat, network, forceDirectedEdges) => {
  const Formatter = getFormatterClass(exportFormat);
  if (!Formatter) {
    // TODO: throw?
    return;
  }
  const formatter = new Formatter(network, forceDirectedEdges);
  // TODO: tmpfile, naming, promis resolution, etc.
  formatter.writeToStream(fs.createWriteStream(`${uuid()}.csv`));
};

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
    // if (!exportFormat) {
    //   return Promise.reject(new Error('exportFormat required'));
    // }
    const exportFormat = exportFormats[0];
    return this.sessionDB.findAll(protocolId, null, null)
      .then(sessions => sessions.map(session => session.data))
      .then(sessions => (exportNetworkUnion ? [unionOfNetworks(sessions)] : sessions))
      .then(networks => Promise.all(networks.map(network =>
        exportFile(exportFormat, network, useDirectedEdges))));
  }
}

module.exports = ExportManager;
