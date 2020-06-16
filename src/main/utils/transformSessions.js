/* eslint-disable no-underscore-dangle */
const { DateTime } = require('luxon');
const { get, find, findIndex, reduce } = require('lodash');
const {
  insertEgoInNetworks,
  unionOfNetworks,
  nodePrimaryKeyProperty,
  nodeAttributesProperty,
  egoProperty,
} = require('../utils/formatters/network');

const getPriorResolutions = (resolutions, resolutionId) => {
  // from oldest to newest
  const sortedResolutions = [...resolutions]
    .sort((a, b) => DateTime.fromJSDate(a._date) - DateTime.fromJSDate(b._date));

  if (!resolutionId) { return sortedResolutions; }

  const lastResolution = findIndex(sortedResolutions, ['_id', resolutionId]);

  if (lastResolution === -1) {
    throw new Error(`Resolution "${resolutionId}" could not be found`);
  }

  return sortedResolutions.slice(0, lastResolution + 1);
};

// 1. chunk sessions by resolutions
// Maybe resolutions should include references to included sessions rather than
// calculating it?
const getSessionsByResolution = (resolutions, sessions) =>
  sessions.reduce((memo, session) => {
    const sessionDate = DateTime.fromJSDate(session._date);

    const resolution = find(
      resolutions,
      ({ _date }) => sessionDate < DateTime.fromJSDate(_date),
    );

    const resolutionId = (resolution && resolution._id) || '_unresolved';

    const group = get(memo, [resolutionId], []);

    return {
      ...memo,
      [resolutionId]: [...group, session],
    };
  }, {});

const applyTransform = (network, transform) => {
  const [withTransformNodesRemoved, collectedProps] = network.nodes
    .reduce(
      ([nodes, props], node) => {
        if (!transform.nodes.includes(node[nodePrimaryKeyProperty])) {
          return [[...nodes, node], props];
        }

        // TODO: do we need any other props? Can we do this automatically? eg. `omit()`?
        return [
          nodes,
          {
            ...props,
            [egoProperty]: [...props[egoProperty], node[egoProperty]],
            type: node.type,
          },
        ];
      },
      [[], { [egoProperty]: [] }],
    );

  // nodes weren't found return original network
  if (withTransformNodesRemoved.length !== network.nodes.length - transform.nodes.length) {
    return network;
  }

  const nodes = withTransformNodesRemoved.concat([{
    ...collectedProps, // egoIds, type, etc.
    // TODO: this can be removed when exporter can handle arrays
    [egoProperty]: collectedProps[egoProperty][0],
    [nodePrimaryKeyProperty]: transform.id,
    [nodeAttributesProperty]: transform.attributes,
  }]);

  const edges = network.edges.map(edge => ({
    ...edge,
    from: transform.nodes.includes(edge.from) ? transform.id : edge.from,
    to: transform.nodes.includes(edge.to) ? transform.id : edge.to,
  }));

  return {
    ...network,
    nodes,
    edges,
  };
};

const transformSessions = (
  sessions,
  resolutions,
  options,
) => {
  // default options
  const { useEgoData, fromResolution: resolutionId, includeUnresolved } = {
    includeUnresolved: true,
    useEgoData: true,
    ...options,
  };

  const priorResolutions = getPriorResolutions(resolutions, resolutionId);
  const sessionsByResolution = getSessionsByResolution(priorResolutions, sessions);

  // For each resolution merge sessions and apply resolution
  const resultNetwork = reduce(
    priorResolutions,
    (accNetwork, { transforms, _id }) => {
      const sessionNetworks = sessionsByResolution[_id]; // array of networks

      if (!sessionNetworks) {
        // if no new sessions, operate on existing
        return transforms.reduce(applyTransform, accNetwork);
      }

      const withEgoData = useEgoData ? insertEgoInNetworks(sessionNetworks) : sessionNetworks;
      const unifiedNetwork = unionOfNetworks([accNetwork, ...withEgoData]);

      return transforms.reduce(applyTransform, unifiedNetwork);
    },
    { nodes: [], edges: [], ego: [] },
  );

  if (includeUnresolved && sessionsByResolution._unresolved) {
    return unionOfNetworks([resultNetwork, ...sessionsByResolution._unresolved]);
  }

  return resultNetwork;
};

module.exports = {
  getPriorResolutions,
  getSessionsByResolution,
  applyTransform,
  transformSessions,
  default: transformSessions,
};
