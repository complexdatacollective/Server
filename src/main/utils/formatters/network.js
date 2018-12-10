// TODO: share with other places this is defined
const nodePrimaryKeyProperty = '_uid';

const nodeAttributesProperty = 'attributes';

const getNodeAttributes = node => node[nodeAttributesProperty] || {};

const unionOfNetworks = networks =>
  networks.reduce((union, network) => {
    union.nodes.push(...network.nodes);
    union.edges.push(...network.edges);
    return union;
  }, { nodes: [], edges: [] });

module.exports = {
  getNodeAttributes,
  nodeAttributesProperty,
  nodePrimaryKeyProperty,
  unionOfNetworks,
};
