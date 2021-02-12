const { get } = require('lodash');

const mergeResolutionMetaAsAttributes = network => ({
  ...network,
  nodes: network.nodes.map(node => ({
    ...node,
    attributes: {
      ...node.attributes,
      _caseId: get(node, 'caseId', []).join('|'),
      _parentId: get(node, 'parentId', []).join('|'),
    }
  })),
});

module.exports = mergeResolutionMetaAsAttributes;