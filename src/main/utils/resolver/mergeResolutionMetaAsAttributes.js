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
      networkCanvasOriginCaseIDs: get(node, 'caseId', []).join('|'),
      networkCanvasOriginUUIDs: get(node, 'parentId', []).join('|'),
    },
  })),
});

module.exports = mergeResolutionMetaAsAttributes;
