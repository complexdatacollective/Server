const { get, toPairs } = require('lodash');

/**
 * When the user selects this type, the attributes for ego and this alter type will be
 * compared according to their name. Attributes not present on one or the other will
 * be summed (so no data will be lost). Attributes that exist for both will be compared,
 * and if type or parameters do not match the attribute will not be passed forward to
 * the resolution script, and will not be included in output data. This is because we
 * depend on a consistent variable type in order to know how to encode the data in CSV
 * or GraphML. We are open to other ways we might be able to handle this.
 */

const castEgoAsNode = (codebook, nodeType) =>
  (network) => {
    const ego = network.ego;

    const nodeVariables = toPairs(get(codebook.node, [nodeType, 'variables'], {}));
    const egoVariables = toPairs(codebook.ego.variables);

    const castEgoAttributes = egoVariables.reduce((acc, [egoVariableId, egoVariableDefinition]) => {
      const [nodeVariableId] = nodeVariables.find(
        ([, nodeVariableDefinition]) =>
          nodeVariableDefinition.name === egoVariableDefinition.name &&
          nodeVariableDefinition.type === egoVariableDefinition.type,
      ) || [];

      const castVariableId = nodeVariableId || egoVariableId;

      return {
        ...acc,
        [castVariableId]: get(ego.attributes, egoVariableId, undefined),
      };
    }, {});

    const egoAsNode = {
      ...ego,
      type: nodeType,
      attributes: castEgoAttributes,
    };

    const newNetwork = {
      nodes: [...network.nodes, egoAsNode],
      edges: network.edges,
    };

    console.log('nodeType', nodeType);

    console.log('network', JSON.stringify({ nodeType, newNetwork }, null, 2));

    return newNetwork;
  };

module.exports = castEgoAsNode;
