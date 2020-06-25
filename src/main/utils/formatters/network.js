const { includes } = require('lodash');
const bigInt = require('big-integer');

const getQuery = require('../network-query/query').default;
const getFilter = require('../network-query/filter').default;

// TODO: share with other places this is defined
const nodePrimaryKeyProperty = '_uid';
const egoProperty = '_egoID';
const caseProperty = '_caseID';
const entityTypeProperty = '_type'; // NC sends as 'type' at the top level, but this will allow us to also look for a user attribute named type

const nodeAttributesProperty = 'attributes';

const getEntityAttributes = node => (node && node[nodeAttributesProperty]) || {};

const convertUuidToDecimal = uuid => (
  // BigInt support is in node 10.4, this poly-fills for now
  uuid ? bigInt(uuid.toString().replace(/-/g, ''), 16).toString(10) : uuid
);

// TODO: _meta: { id, caseID }
const unionOfNetworks = networks =>
  networks.reduce((union, network) => ({
    nodes: [...union.nodes, ...network.nodes],
    edges: [...union.edges, ...network.edges],
    // ego is an object for a single network, and an array for a previously unified network
    ego: [...union.ego, ...(!Array.isArray(network.ego) ? [network.ego] : network.ego)],
  }), { nodes: [], edges: [], ego: [], _id: '' });

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
      { [egoProperty]: network.ego[nodePrimaryKeyProperty], ...node }
    )),
    edges: network.edges.map(edge => (
      { [egoProperty]: network.ego[nodePrimaryKeyProperty], ...edge }
    )),
    ego: { ...network.sessionVariables, ...network.ego },
  }
);

const insertEgoInNetworks = networks => (
  networks.map(network => insertNetworkEgo(network))
);

const transposedCodebookVariables = (sectionCodebook, definition) => {
  if (!definition.variables) { // not required for edges
    sectionCodebook[definition.name] = definition; // eslint-disable-line no-param-reassign
    return sectionCodebook;
  }

  const displayVariable = definition.variables[definition.displayVariable];

  const variables = Object.values(definition.variables).reduce((acc, variable) => {
    acc[variable.name] = variable;
    return acc;
  }, {});
  sectionCodebook[definition.name] = { // eslint-disable-line no-param-reassign
    ...definition,
    displayVariable: displayVariable && displayVariable.name,
    variables,
  };
  return sectionCodebook;
};

const transposedCodebookSection = (section = {}) =>
  Object.values(section).reduce((sectionCodebook, definition) => (
    transposedCodebookVariables(sectionCodebook, definition)
  ), {});

const transposedCodebook = (codebook = {}) => ({
  edge: transposedCodebookSection(codebook.edge),
  node: transposedCodebookSection(codebook.node),
  ego: transposedCodebookVariables({}, { ...codebook.ego, name: 'ego' }).ego,
});

const formatSessionAsNetwork = (session) => {
  // eslint-disable-next-line no-underscore-dangle
  const id = session && session._id;
  const caseID = session && session.data &&
    session.data.sessionVariables &&
    // eslint-disable-next-line no-underscore-dangle
    session.data.sessionVariables._caseID;

  return ({
    ...session.data,
    _caseID: caseID,
    _id: id,
    _date: session.createdAt,
  });
};

module.exports = {
  convertUuidToDecimal,
  filterNetworkEntities,
  filterNetworksWithQuery,
  getEntityAttributes,
  insertEgoInNetworks,
  nodeAttributesProperty,
  entityTypeProperty,
  egoProperty,
  caseProperty,
  nodePrimaryKeyProperty,
  processEntityVariables,
  transposedCodebook,
  transposedCodebookSection,
  unionOfNetworks,
  formatSessionAsNetwork,
};
