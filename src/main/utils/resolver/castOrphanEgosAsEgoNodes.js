/* eslint-disable no-underscore-dangle */

const castOrphanEgosAsEgoNode = (sessions, protocol, resolvedNetwork) => {
  // Collect all egos from sessions
  const egos = sessions.reduce(
    (acc, { ego }) => ({
      ...acc,
      // TODO: inject caseId
      [ego._uid]: { ...ego, type: '_ego' }, // eslint-disable-line no-underscore-dangle
    }),
    {},
  );
  const egoIds = Object.keys(egos);

  // Create ego type in codebook
  const modifiedProtocol = {
    ...protocol,
    codebook: {
      ...protocol.codebook,
      ego: {},
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
