/* eslint-disable no-underscore-dangle */
const { DateTime } = require('luxon');
const {
  get, find, reduce, uniq,
} = require('lodash');
const {
  formatSession,
  formatResolution,
  unionOfNetworks,
  properties,
} = require('./helpers');
const castEgoAsNode = require('./castEgoAsNode');

// 1. chunk sessions by resolutions
// Maybe resolutions should include references to included sessions rather than
// calculating it?
const getSessionsByResolution = (resolutions, sessions) => sessions.reduce((memo, session) => {
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
        if (!transform.nodes.includes(node[properties.nodePrimaryKey])) {
          return [[...accNodes, node], accProps];
        }

        const caseId = uniq([...accProps.caseId, ...get(node, 'caseId', [])]);
        const parentId = uniq([...accProps.parentId, ...get(node, 'parentId', [])]);

        // Otherwise, we remove the node from the list and collect some
        // meta data about the original session it belonged to (the caseId and egoId),
        // and the node type.
        return [
          accNodes,
          {
            ...accProps, // previous props
            caseId,
            parentId,
            type: node.type,
          },
        ];
      },
      [
        [],
        { caseId: [], parentId: [] },
      ],
    );

  // If the truncated network is the same size as the original, then no matching
  // nodes were found, meaning the transform has no effect and the original
  // network can be returned.
  if (nodesWithTransformedTargetsRemoved.length !== network.nodes.length - transform.nodes.length) {
    return network;
  }

  const parentId = uniq(...transformTargetMetaData.parentId, get(transform, 'nodes', []));

  // The transform includes the attributes for the replacement node, so we can
  // now append that to the list of nodes.
  const nodes = nodesWithTransformedTargetsRemoved.concat([{
    ...transformTargetMetaData, // type, caseId etc.
    parentId,
    [properties.nodePrimaryKey]: transform.id,
    [properties.nodeAttributes]: transform.attributes,
  }]);

  // Update edges to point to this newly inserted node
  const edges = network.edges.map((edge) => ({
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
  sortedSessions, // sortBy(sessions, ['date']);
  sortedResolutions, // sortBy(resolutions, ['date']);
  options,
) => {
  // default options
  const { egoCastType, includeUnresolved } = {
    includeUnresolved: true,
    ...options,
  };

  const sessionsByResolution = getSessionsByResolution(sortedResolutions, sortedSessions);
  const egoCaster = castEgoAsNode(protocol.codebook, egoCastType);

  // For each resolution, cumulatively merge any new sessions and apply resolution
  const resolvedNetwork = reduce(
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

  // Add unresolved sessions if option selected
  if (includeUnresolved && sessionsByResolution._unresolved) {
    const unresolvedWithEgos = sessionsByResolution._unresolved.map(egoCaster);

    return unionOfNetworks([resolvedNetwork, ...unresolvedWithEgos]);
  }

  return resolvedNetwork;
};

module.exports = {
  formatSession,
  formatResolution,
  getSessionsByResolution,
  applyTransform,
  transformSessions,
  default: transformSessions,
};
