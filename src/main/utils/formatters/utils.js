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

module.exports = {
  extensions,
  formats,
  formatsAreValid,
  getFileExtension,
  getFormatterClass,
};
