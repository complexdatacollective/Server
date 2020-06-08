const miss = require('mississippi');
const { reduce, toPairs } = require('lodash');
const { nodePrimaryKeyProperty, nodeAttributesProperty, entityTypeProperty, egoProperty } = require('../formatters/network');
const { cellValue, csvEOL } = require('../formatters/csv');

const initialHeadings = {
  [nodePrimaryKeyProperty]: 'networkCanvasAlterID',
  [entityTypeProperty]: 'networkCanvasNodeType',
  [egoProperty]: 'networkCanvasEgoID',
};

const getHeadings = (codebook) => {
  const headings = reduce(
    codebook.node,
    (attributes, nodeDefinition) =>
      reduce(
        nodeDefinition.variables,
        (memo, variable, id) => ({
          ...memo,
          [id]: variable.name,
        }),
        attributes,
      ),
    { ...initialHeadings },
  );

  return toPairs(headings);
};

const getAttributes = (headings, node) => {
  const attributes = node[nodeAttributesProperty];

  return headings.map(([id]) => {
    switch (id) {
      case nodePrimaryKeyProperty:
      case entityTypeProperty:
      case egoProperty:
        return node[id];
      default:
        return attributes[id];
    }
  });
};

const csvRow = cells =>
  `${cells.map(v => cellValue(v)).join(',')}${csvEOL}`;

const networkNodeTable = (codebook, nodes = []) => {
  const headings = getHeadings(codebook);

  let firstRow = true;

  const tableStream = miss.from((size, next) => {
    try {
      if (firstRow === true) {
        firstRow = false;
        return next(null, csvRow(headings.map(([, v]) => v)));
      }

      if (nodes.length === 0) {
        return next(null, null);
      }

      const node = nodes.shift();

      return next(null, csvRow(getAttributes(headings, node)));
    } catch (err) {
      return next(err);
    }
  });

  tableStream.abort = () => {
    tableStream.destroy();
  };

  return tableStream;
};

module.exports = networkNodeTable;
