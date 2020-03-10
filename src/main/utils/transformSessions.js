/* eslint-disable no-underscore-dangle */
const { DateTime } = require('luxon');
const { get, find, findIndex, reduce } = require('lodash');
const {
  insertEgoInNetworks,
  unionOfNetworks,
  nodePrimaryKeyProperty,
  nodeAttributesProperty,
} = require('../utils/formatters/network');

const getPriorResolutions = (resolutions, resolutionId) => {
  // from oldest to newest
  const sortedResolutions = [...resolutions]
    .sort((a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date));


  if (!resolutionId) { return sortedResolutions; }

  const lastResolution = findIndex(sortedResolutions, ['id', resolutionId]);

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
    const sessionDate = DateTime.fromISO(session.date);

    const resolution = find(
      resolutions,
      ({ date }) =>
        sessionDate < DateTime.fromISO(date),
    );

    const resolutionId = (resolution && resolution.id) || '_unresolved';

    const group = get(memo, [resolutionId], []);

    return {
      ...memo,
      [resolutionId]: [...group, session],
    };
  }, {});

// TODO: make sure this still contains _egoID for 'new' nodes
const applyTransform = (network, transform) => {
  const withTransformNodesRemoved = network.nodes.filter(
    node => !transform.nodes.includes(node[nodePrimaryKeyProperty]),
  );

  // nodes weren't found return original network
  if (withTransformNodesRemoved.length !== network.nodes.length - transform.nodes.length) {
    return network;
  }

  const nodes = withTransformNodesRemoved.concat([{
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

const transformSessions = (sessions, resolutions, { useEgoData, fromResolution }) => {
  const priorResolutions = getPriorResolutions(resolutions, fromResolution);
  const sessionsByResolution = getSessionsByResolution(priorResolutions, sessions);

  // For each resolution merge sessions and apply resolution
  const resultNetwork = reduce(
    priorResolutions,
    (accNetwork, resolution) => {
      const sessionNetworks = sessionsByResolution[resolution.id]; // array of networks

      if (!sessionNetworks) {
        // if no new sessions, operate on existing
        return resolution.transforms.reduce(applyTransform, accNetwork);
      }

      const withEgoData = useEgoData ? insertEgoInNetworks(sessionNetworks) : sessionNetworks;
      const unifiedNetwork = unionOfNetworks([accNetwork, ...withEgoData]);

      return resolution.transforms.reduce(applyTransform, unifiedNetwork);
    },
    { nodes: [], edges: [], ego: [] },
  );

  if (sessionsByResolution._unresolved) {
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
