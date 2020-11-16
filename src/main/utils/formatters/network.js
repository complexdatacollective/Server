const { includes } = require('lodash');
const bigInt = require('big-integer');

const { egoProperty, entityPrimaryKeyProperty, entityAttributesProperty } = require('../network-exporters/src/utils/reservedAttributes');
const getQuery = require('../network-query/query').default;
const getFilter = require('../network-query/filter').default;

const entityTypeProperty = '_type'; // NC sends as 'type' at the top level, but this will allow us to also look for a user attribute named type

const getEntityAttributes = node => (node && node[entityAttributesProperty]) || {};

const convertUuidToDecimal = uuid => (
  // BigInt support is in node 10.4, this poly-fills for now
  uuid ? bigInt(uuid.toString().replace(/-/g, ''), 16).toString(10) : uuid
);

const unionOfNetworks = networks =>
  networks.reduce((union, network) => {
    union.nodes.push(...network.nodes);
    union.edges.push(...network.edges);
    union.ego.push(network.ego);
    return union;
  }, { nodes: [], edges: [], ego: [], _id: '' });

const processEntityVariables = (entity, variables) => ({
  ...entity,
  attributes: Object.keys(getEntityAttributes(entity)).reduce(
    (accumulatedAttributes, attributeName) => {
      const attributeData = getEntityAttributes(entity)[attributeName];
      if (variables[attributeName] && variables[attributeName].type === 'categorical') {
        const optionNames = variables[attributeName].options || [];
        const optionData = optionNames.reduce((accumulatedOptions, optionName) => (
          {
            ...accumulatedOptions,
            [`${attributeName}_${optionName.value}`]: !!attributeData && includes(attributeData, optionName.value),
          }
        ), {});
        return { ...accumulatedAttributes, ...optionData };
      } else if (variables[attributeName] && variables[attributeName].type === 'layout') {
        const layoutAttrs = {
          [`${attributeName}_x`]: attributeData && attributeData.x,
          [`${attributeName}_y`]: attributeData && attributeData.y,
        };
        return { ...accumulatedAttributes, ...layoutAttrs };
      }
      return { ...accumulatedAttributes, [attributeName]: attributeData };
    }, {}),
});

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
    ...network,
    nodes: network.nodes.map(node => (
      { [egoProperty]: network.ego[entityPrimaryKeyProperty], ...node }
    )),
    edges: network.edges.map(edge => (
      { [egoProperty]: network.ego[entityPrimaryKeyProperty], ...edge }
    )),
    ego: { ...network.sessionVariables, ...network.ego },
  }
);

const insertEgoInNetworks = networks => (
  networks.map(network => insertNetworkEgo(network))
);

module.exports = {
  convertUuidToDecimal,
  filterNetworkEntities,
  filterNetworksWithQuery,
  getEntityAttributes,
  insertEgoInNetworks,
  entityTypeProperty,
  processEntityVariables,
  unionOfNetworks,
};
