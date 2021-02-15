const { assign } = require('lodash/fp');
const { get } = require('lodash');

const properties = {
  case: 'caseId',
  ego: '_egoID',
  entityType: '_type',
  nodeAttributes: 'attributes',
  nodePrimaryKey: '_uid',
};

const formatSession = ({ data, createdAt }) => ({ date: createdAt, ...data });

const formatResolution = ({
  _id,
  createdAt,
  transforms,
  options,
}) => ({
  id: _id,
  date: createdAt,
  transformCount: transforms.length,
  options,
  transforms,
});

const unionOfNetworks = networks =>
  networks.reduce((union, network) => {
    const meta = { caseId: [get(network, 'sessionVariables.caseId')] };
    return {
      nodes: [...union.nodes, ...network.nodes.map(assign(meta))],
      edges: [...union.edges, ...network.edges.map(assign(meta))],
    };
  }, { nodes: [], edges: [] });

module.exports = {
  formatSession,
  formatResolution,
  unionOfNetworks,
  properties,
};
