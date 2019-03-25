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
    union.ego.push(network.ego); // TODO undefined is not a function
    return union;
  }, { nodes: [], edges: [], ego: [] });

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

const insertNetworkEgo = network => (
  {
    nodes: network.nodes.map(node => ({ _egoID: network.ego[nodePrimaryKeyProperty], ...node })),
    edges: network.edges.map(edge => ({ _egoID: network.ego[nodePrimaryKeyProperty], ...edge })),
    ego: { ...network.ego, attributes: { ...network.sessionVariables, ...network.ego.attributes } },
  }
);

const insertEgoInNetworks = networks => (
  networks.map(network => insertNetworkEgo(network))
);

const transposedRegistrySection = (section = {}) =>
  Object.values(section).reduce((sectionRegistry, definition) => {
    if (!definition.variables) { // not required for edges
      sectionRegistry[definition.name] = definition; // eslint-disable-line no-param-reassign
      return sectionRegistry;
    }

    const displayVariable = definition.variables[definition.displayVariable];

    const variables = Object.values(definition.variables).reduce((acc, variable) => {
      acc[variable.name] = variable;
      return acc;
    }, {});
    sectionRegistry[definition.name] = { // eslint-disable-line no-param-reassign
      ...definition,
      displayVariable: displayVariable && displayVariable.name,
      variables,
    };
    return sectionRegistry;
  }, {});

const transposedRegistry = (registry = {}) => ({
  edge: transposedRegistrySection(registry.edge),
  node: transposedRegistrySection(registry.node),
});

module.exports = {
  filterNetworkEntities,
  filterNetworksWithQuery,
  getNodeAttributes,
  insertEgoInNetworks,
  nodeAttributesProperty,
  nodePrimaryKeyProperty,
  transposedRegistry,
  transposedRegistrySection,
  unionOfNetworks,
};
