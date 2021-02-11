/* eslint-disable no-underscore-dangle */
const { DateTime } = require('luxon');
const { get, find, reduce, uniq, sortBy } = require('lodash');
const {
  unionOfNetworks,
  nodePrimaryKeyProperty,
  nodeAttributesProperty,
  egoProperty,
  caseProperty,
} = require('../formatters/network');
const castEgoAsNode = require('./castEgoAsNode');

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

// 1. chunk sessions by resolutions
// Maybe resolutions should include references to included sessions rather than
// calculating it?
const getSessionsByResolution = (resolutions, sessions) =>
  sessions.reduce((memo, session) => {
    const sessionDate = DateTime.fromJSDate(session.date);

    const resolution = find(
      resolutions,
      ({ date }) => DateTime.fromJSDate(date) > sessionDate,
    );

    const resolutionId = (resolution && resolution.id) || '_unresolved';

    const group = get(memo, [resolutionId], []);

    return {
      ...memo,
      [resolutionId]: [...group, session],
    };
  }, {});

/**
 * Apply a single transformation to the network.
 *
 * A transform includes a list of nodes to be substituted,
 * and the new id/attributes for the substitute node:
 *
 *     {
 *       nodes: [ ...list of node ids ],
 *       id: ...new node id,
 *       attributes: {
 *         ...node attributes for the substitute node
 *       },
 *     }
 */
const applyTransform = (network, transform) => {
  // Remove the transformed nodes from the network, and collect
  // meta data about the origins of the removed nodes (caseId, and egoId),
  // as well as the node type.
  const [
    nodesWithTransformedTargetsRemoved,
    transformTargetMetaData,
  ] = network.nodes
    .reduce(
      ([accNodes, accProps], node) => {
        // `transform.nodes` is an array of node ids that the transform
        // applies to. If the node is not being transformed, return it
        // as is.
        if (!transform.nodes.includes(node[nodePrimaryKeyProperty])) {
          return [[...accNodes, node], accProps];
        }

        // Otherwise, we remove the node from the list and collect some
        // meta data about the original session it belonged to (the caseId and egoId),
        // and the node type.
        return [
          accNodes,
          {
            ...accProps, // previous props
            [egoProperty]: [...accProps[egoProperty], node[egoProperty]],
            [caseProperty]: uniq([...accProps[caseProperty], node[caseProperty]]),
            type: node.type,
          },
        ];
      },
      [
        [],
        { [egoProperty]: [], [caseProperty]: [] },
      ],
    );

  // If the truncated network is the same size as the original, then no matching
  // nodes were found, meaning the transform has no effect and the original
  // network can be returned.
  if (nodesWithTransformedTargetsRemoved.length !== network.nodes.length - transform.nodes.length) {
    return network;
  }

  // The transform includes the attributes for the replacement node, so we can
  // now append that to the list of nodes.
  const nodes = nodesWithTransformedTargetsRemoved.concat([{
    ...transformTargetMetaData, // egoIds, type, etc.
    // [egoProperty]: transformTargetMetaData[egoProperty][0], // exporter cannot handle arrays
    // [caseProperty]: collectedProps[caseProperty][0], // exporter cannot handle arrays
    [nodePrimaryKeyProperty]: transform.id,
    [nodeAttributesProperty]: transform.attributes,
  }]);

  // Update edges to point to this newly inserted node
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
  protocol,
  sessions,
  resolutions,
  options,
) => {
  // default options
  const { egoCastType, includeUnresolved } = {
    includeUnresolved: true,
    ...options,
  };

  const sortedResolutions = sortBy(resolutions, ['date']);
  const sortedSessions = sortBy(sessions, ['date']);

  const sessionsByResolution = getSessionsByResolution(sortedResolutions, sortedSessions);
  const egoCaster = castEgoAsNode(protocol.codebook, egoCastType);

  // For each resolution, cumulatively merge any new sessions and apply resolution
  const resultNetwork = reduce(
    sortedResolutions,
    (accNetwork, { transforms, id }) => {
      const sessionNetworks = sessionsByResolution[id]; // array of networks

      // if no sessions tied to this specific resolution, we apply the transform
      // to the cumulative network so-far
      if (!sessionNetworks) {
        // 1. Apply the resolutions to the network as-is
        return transforms.reduce(applyTransform, accNetwork);
      }

      // otherwise, we need to merge those new sessions first,
      // before then applying the transform

      // Convert egos into nodes
      const sessionNetworksWithEgos = sessionNetworks.map(egoCaster);
      // const sessionNetworksWithEgos = sessionNetworks;

      // Combine new sessions with existing super network
      // (unifiedNetwork)
      const { nodes, edges } = unionOfNetworks([accNetwork, ...sessionNetworksWithEgos]);

      // 2. (or) apply the resolutions to the network with new sessions
      return transforms.reduce(applyTransform, { nodes, edges });
    },
    { nodes: [], edges: [] },
  );

  if (includeUnresolved && sessionsByResolution._unresolved) {
    const unresolvedWithEgos = sessionsByResolution._unresolved.map(egoCaster);

    return unionOfNetworks([resultNetwork, ...unresolvedWithEgos]);
  }

  return resultNetwork;
};

module.exports = {
  formatSession,
  formatResolution,
  getSessionsByResolution,
  applyTransform,
  transformSessions,
  default: transformSessions,
};
