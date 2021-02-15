import { findKey, get } from 'lodash';
import { properties } from '../../../main/utils/resolver/helpers';

export const getMatch = (matches, index) => {
  if (matches.length < index + 1) { return null; }

  return {
    ...matches[index],
    index,
  };
};

export const getMatchOrResolved = (match, resolutions) => {
  if (!match) { return null; }

  const reversedResolutions = [...resolutions].reverse();

  const nodes = match.nodes.map((node) => {
    const resolution = reversedResolutions
      .find(r => r.nodes.includes(node[properties.nodePrimaryKey]));

    if (!resolution) { return node; }

    return {
      ...node,
      _resolvedId: resolution.id,
      attributes: resolution.attributes,
    };
  });

  return {
    ...match,
    nodes,
  };
};

// See: https://github.com/codaco/Network-Canvas/wiki/Node-Labeling
export const labelLogic = (codebookForNodeType, nodeAttributes) => {
  // In the codebook for the stage's subject, look for a variable with a name
  // property of "name", and try to retrieve this value by key in the node's
  // attributes
  const variableCalledName =
    codebookForNodeType &&
    codebookForNodeType.variables &&
    // Ignore case when looking for 'name'
    findKey(codebookForNodeType.variables, variable => variable.name.toLowerCase() === 'name');

  if (variableCalledName && nodeAttributes[variableCalledName]) {
    return nodeAttributes[variableCalledName];
  }

  // Look for a property on the node with a key of ‘name’, and try to retrieve this
  // value as a key in the node's attributes.
  // const nodeVariableCalledName = get(nodeAttributes, 'name');

  const nodeVariableCalledName = find(
    nodeAttributes,
    (_, key) => key.toLowerCase() === 'name',
  );

  if (nodeVariableCalledName) {
    return nodeVariableCalledName;
  }

  // Last resort!
  return 'No \'name\' variable!';
};

export const getMatchId = match =>
  `${get(match, ['nodes', 0, '_uid'], 0)}_${get(match, ['nodes', 1, '_uid'], 0)}`;

export const getNodeTypeDefinition = (codebook, nodeType) =>
  get(codebook, ['node', nodeType]);

export const getVariableName = (nodeTypeDefinition, variable) =>
  get(nodeTypeDefinition, ['variables', variable, 'name']);

export const getRequiredAttributes = (nodeTypeDefinition, match) => {
  if (!match) { return []; }

  const [a, b] = match.nodes;

  const variables = get(nodeTypeDefinition, 'variables', {});

  const requiredAttributes = Object.keys(variables)
    .filter((variable) => {
      const areDifferent = a.attributes[variable] !== b.attributes[variable];
      const isName = getVariableName(nodeTypeDefinition, variable) === 'name';

      return areDifferent || isName;
    });

  return requiredAttributes;
};

export const getLabel = (nodeTypeDefinition, node) => {
  const nodeLabel = labelLogic(nodeTypeDefinition, get(node, properties.nodeAttributes, {}));
  return nodeLabel;
};

