const miss = require('mississippi');
const { reduce, toPairs, get } = require('lodash');
const { properties } = require('../resolver/helpers');

const defaultHeadings = {
  [properties.nodePrimaryKey]: 'networkCanvasAlterID',
  [properties.entityType]: 'networkCanvasNodeType',
};

const egoHeading = {
  [properties.ego]: 'networkCanvasEgoID',
};

const getHeadings = (codebook, initialHeadings = defaultHeadings) => {
  const headings = reduce(
    codebook.node,
    (attributes, nodeDefinition) => reduce(
      nodeDefinition.variables,
      (memo, variable, id) => ({
        ...memo,
        [id]: `${id}`,
      }),
      attributes,
    ),
    { ...initialHeadings },
  );

  return toPairs(headings);
};

const getAttributes = (headings, node) => {
  const attributes = node[properties.nodeAttributes];

  return headings.map(([id]) => {
    switch (id) {
      case properties.nodePrimaryKey:
      case properties.ego:
        return node[id];
      case properties.entityType:
        return node.type; // TODO: shim until we find out why "properties.type" is _type
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

  const tableStream = miss.from((size, next) => {
    try {
      if (firstRow === true) {
        firstRow = false;
        return next(null, JSON.stringify(headings.map(([, v]) => v)));
      }

      if (nodes.length === 0) {
        return next(null, null);
      }

      const node = nodes.shift();

      return next(null, JSON.stringify(getAttributes(headings, node)));
    } catch (err) {
      err.friendlyMessage = 'error in nodesToTable()';
      return next(err);
    }
  });

  tableStream.abort = () => {
    tableStream.destroy();
  };

  return tableStream;
};

module.exports = nodesToTable;
