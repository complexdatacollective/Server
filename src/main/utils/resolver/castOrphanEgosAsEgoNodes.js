/* eslint-disable no-underscore-dangle */

const castOrphanEgosAsEgoNode = (sessions, protocol, resolvedNetwork) => {
  // Collect all egos from sessions
  const egos = sessions.reduce(
    (acc, { ego, sessionVariables }) => ({
      ...acc,
      [ego._uid]: {
        ...ego,
        type: '_ego',
        caseId: [sessionVariables.caseId],
      }, // eslint-disable-line no-underscore-dangle
    }),
    {},
  );

  const egoIds = Object.keys(egos);

  if (egoIds.length === 0) {
    return [resolvedNetwork, protocol];
  }

  /**
   * Create a replacement node type for ego in codebook
   * `{ codebook: { node: { _ego } } }`, and omit top
   * level ego entry
   */
  const modifiedProtocol = {
    ...protocol,
    codebook: {
      edge: protocol.codebook.edge,
      node: {
        ...protocol.codebook.node,
        _ego: {
          name: 'ego',
          ...protocol.codebook.ego,
        },
      },
    },
  };

  const modifiedNetwork = {
    ...resolvedNetwork,
    nodes: resolvedNetwork.nodes.map(
      (node) => {
        const id = node._uid;

        if (egoIds.includes(id)) {
          return egos[id];
        }

        return node;
      },
    ),
  };

  // insert egos into network as ego type
  return [modifiedNetwork, modifiedProtocol];
};

module.exports = castOrphanEgosAsEgoNode;
