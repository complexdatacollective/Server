/**
 * @module ExportUtils
 */

const {
  AdjacencyMatrixFormatter,
  AdjacencyListFormatter,
  AttributeListFormatter,
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
  adjacencyList: 'adjacencyList',
  attributeList: 'attributeList',
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
      return '.graphml';
    case formats.adjacencyMatrix:
    case formats.adjacencyList:
    case formats.attributeList:
      return '.csv';
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
    case formats.adjacencyList:
      return AdjacencyListFormatter;
    case formats.attributeList:
      return AttributeListFormatter;
    default:
      return null;
  }
};

module.exports = {
  formats,
  formatsAreValid,
  getFileExtension,
  getFormatterClass,
};
