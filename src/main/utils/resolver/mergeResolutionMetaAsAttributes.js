const { get } = require('lodash');

/**
 * Move meta data used in resolutions into node
 * attributes where relevant.
 */
const mergeResolutionMetaAsAttributes = network => ({
  ...network,
  nodes: network.nodes.map(node => ({
    ...node,
    attributes: {
      ...node.attributes,
      _caseId: get(node, 'caseId', []).join('|'),
      _parentId: get(node, 'parentId', []).join('|'),
    },
  })),
});

module.exports = mergeResolutionMetaAsAttributes;
