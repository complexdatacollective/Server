/**
 * @module ExportUtils
 */

const {
  AdjacencyMatrixFormatter,
  AttributeListFormatter,
  EdgeListFormatter,
  GraphMLFormatter,
} = require('./index');

/**
 * Possible values for data export
 * @enum {string}
 */
const formats = {
  graphml: 'graphml',
  // CSV:
  adjacencyMatrix: 'adjacencyMatrix',
  attributeList: 'attributeList',
  edgeList: 'edgeList',
};

const extensions = {
  graphml: '.graphml',
  csv: '.csv',
};

/**
 * Check validity of supplied formats
 * @param  {string[]} suppliedFormats
 * @return {boolean} `true` if every supplied format is a valid type (or suppliedFormats is empty);
 *                   `false` if suppliedFormats is falsy or contains an invalid format.
 */
const formatsAreValid = suppliedFormats =>
  (suppliedFormats && suppliedFormats.every(format => formats[format])) || false;

/**
 * Partition a network as needed for edge-list and adjacency-matrix formats.
 * Each network contains a reference to the original nodes, with a subset of edges
 * based on the type.
 *
 * @param  {Array} network in NC format
 * @param  {string} format one of `formats`
 * @return {Array} An array of networks, partitioned by edge type. Each network object is decorated
 *                 with an additional `edgeType` prop to facilitate format naming.
 */
const partitionByEdgeType = (network, format) => {
  switch (format) {
    case formats.graphml:
    case formats.attributeList:
      return [network];
    case formats.edgeList:
    case formats.adjacencyMatrix: {
      if (!network.edges.length) {
        return [network];
      }

      const { nodes } = network;
      const partitionedEdgeMap = network.edges.reduce((edgeMap, edge) => {
        edgeMap[edge.type] = edgeMap[edge.type] || []; // eslint-disable-line no-param-reassign
        edgeMap[edge.type].push(edge);
        return edgeMap;
      }, {});

      return Object.entries(partitionedEdgeMap).map(([edgeType, edges]) => ({
        nodes,
        edges,
        edgeType,
      }));
    }
    default:
      throw new Error('Unexpected format', format);
  }
};

/**
 * Provide the appropriate file extension for the export type
 * @param  {string} formatterType one of the `format`s
 * @return {string}
 */
const getFileExtension = (formatterType) => {
  switch (formatterType) {
    case formats.graphml:
      return extensions.graphml;
    case formats.adjacencyMatrix:
    case formats.edgeList:
    case formats.attributeList:
      return extensions.csv;
    default:
      return null;
  }
};

/**
 * Formatter factory
 * @param  {string} formatterType one of the `format`s
 * @return {class}
 */
const getFormatterClass = (formatterType) => {
  switch (formatterType) {
    case formats.graphml:
      return GraphMLFormatter;
    case formats.adjacencyMatrix:
      return AdjacencyMatrixFormatter;
    case formats.edgeList:
      return EdgeListFormatter;
    case formats.attributeList:
      return AttributeListFormatter;
    default:
      return null;
  }
};


/**
 * A very simple progress accumulator which divides the total work into a number of
 * micro-steps, each step being one write of an export worker to its output stream.
 *
 * This relies on all workers making progress concurrently; if work is serialized, no
 * cumulative progress will be reported.
 *
 * This should be good enough as long as stream throughput is consistent and each worker
 * step is doing roughly the same amount of work. (Note that matrix output may currently vary
 * significantly and we may want to improve this, but see #218.)
 *
 * @param  {Function} onProgressUpdate callback for cumulative progress updates,
 *                                     receiving a `fractionCompleted` argument.
 * @param  {number} workerCount the number of exporters which will be reporting progress
 * @return {Function} an individual progress handler which can be passed to an exporter
 */
const cumulativeProgressHandler = (onProgressUpdate, workerCount) => {
  let allWorkersStarted = false;
  let stepsToCompletion;
  const workerProgress = {};
  return (exportId, fractionCompleted) => {
    if (!workerProgress[exportId]) {
      workerProgress[exportId] = {
        numberOfSteps: 1 / fractionCompleted,
      };
    }
    const thisWorker = workerProgress[exportId];
    thisWorker.fractionCompleted = fractionCompleted;
    thisWorker.stepsCompleted = fractionCompleted * thisWorker.numberOfSteps;

    allWorkersStarted = allWorkersStarted || (Object.keys(workerProgress).length === workerCount);

    if (allWorkersStarted) {
      stepsToCompletion = stepsToCompletion ||
        Object.values(workerProgress).reduce((sum, worker) => sum + worker.numberOfSteps, 0);

      const cumulativeProgress = Object.values(workerProgress).reduce((weightedAvg, worker) =>
        weightedAvg + (worker.fractionCompleted * worker.numberOfSteps / stepsToCompletion), 0);

      onProgressUpdate(cumulativeProgress);
    }
  };
};

module.exports = {
  extensions,
  formats,
  formatsAreValid,
  cumulativeProgressHandler,
  getFileExtension,
  getFormatterClass,
  partitionByEdgeType,
};
