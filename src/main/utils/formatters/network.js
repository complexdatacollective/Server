const getQuery = require('../network-query/query').default;
const getFilter = require('../network-query/filter').default;

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

/**
 * Run the query on each network; filter for those which meet the criteria (i.e., where the query
 * evaluates to `true`).
 * @param  {Object[]} networks An array of NC networks
 * @param  {Object} inclusionQueryConfig a query definition with asserting rules
 * @return {Object[]} a subset of the networks
 */
const filterNetworksWithQuery = (networks, inclusionQueryConfig) =>
  (inclusionQueryConfig ? networks.filter(getQuery(inclusionQueryConfig)) : networks);

/**
 * Filter each network based on the filter config.
 * @param  {Object[]} networks An array of NC networks
 * @param  {Object} filterConfig a filter definition with rules
 * @return {Object[]} a copy of `networks`, each possibly containing a subset of the original
 */
const filterNetworkEntities = (networks, filterConfig) => {
  if (!filterConfig || !filterConfig.rules || !filterConfig.rules.length) {
    return networks;
  }
  const filter = getFilter(filterConfig);
  return networks.map(network => filter(network));
};

module.exports = {
  filterNetworkEntities,
  filterNetworksWithQuery,
  getNodeAttributes,
  nodeAttributesProperty,
  nodePrimaryKeyProperty,
  unionOfNetworks,
};
