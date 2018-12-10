const {
  AdjacencyMatrixFormatter,
  AdjacencyListFormatter,
  AttributeListFormatter,
  GraphMLFormatter,
} = require('./index');

const formats = {
  graphml: 'graphml',
  // CSV:
  adjacencyMatrix: 'adjacencyMatrix',
  adjacencyList: 'adjacencyList',
  attributeList: 'attributeList',
};

const formatsAreValid = suppliedFormats =>
  (suppliedFormats && suppliedFormats.every(format => formats[format])) || false;

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
