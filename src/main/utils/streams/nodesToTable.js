const miss = require('mississippi');
const { reduce, toPairs, get } = require('lodash');
const { nodePrimaryKeyProperty, nodeAttributesProperty, entityTypeProperty, egoProperty } = require('../formatters/network');

const defaultHeadings = {
  [nodePrimaryKeyProperty]: 'networkCanvasAlterID',
  [entityTypeProperty]: 'networkCanvasNodeType',
};

const egoHeading = {
  [egoProperty]: 'networkCanvasEgoID',
};

const getHeadings = (codebook, initialHeadings = defaultHeadings) => {
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

const nodesToTable = (codebook, options = {}, nodes = []) => {
  const includeEgo = get(options, 'includeEgo', false);
  const initialHeadings = includeEgo ? { ...defaultHeadings, ...egoHeading } : defaultHeadings;
  const headings = getHeadings(codebook, initialHeadings);

  let firstRow = true;

  const tableStream = miss.from({ objectMode: true }, (size, next) => {
    try {
      if (firstRow === true) {
        firstRow = false;
        return next(null, headings.map(([, v]) => v));
      }

      if (nodes.length === 0) {
        return next(null, null);
      }

      const node = nodes.shift();

      return next(null, getAttributes(headings, node));
    } catch (err) {
      return next(err);
    }
  });

  tableStream.abort = () => {
    tableStream.destroy();
  };

  return tableStream;
};

module.exports = nodesToTable;
