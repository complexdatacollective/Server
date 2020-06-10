import { findKey, get } from 'lodash';
import { getEntityAttributes } from '%main/utils/formatters/network';

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

export const getNodeTypeDefinition = (codebook, node) => {
  const nodeType = get(node, 'type');
  return get(codebook, ['node', nodeType]);
};

export const getVariableName = (nodeTypeDefinition, variable) =>
  get(nodeTypeDefinition, ['variables', variable, 'name']);

export const getRequiredAttributes = (codebook, match) => {
  if (!match) { return []; }

  const [a, b] = match.nodes;
  const nodeTypeDefinition = getNodeTypeDefinition(codebook, a);

  const requiredAttributes = Object.keys(a.attributes)
    .filter((variable) => {
      const areDifferent = a.attributes[variable] !== b.attributes[variable];
      const isName = getVariableName(nodeTypeDefinition, variable) === 'name';

      return areDifferent || isName;
    });

  return requiredAttributes;
};

export const getLabel = (codebook, node) => {
  const nodeTypeDefinition = getNodeTypeDefinition(codebook, node);
  const nodeLabel = labelLogic(nodeTypeDefinition, getEntityAttributes(node));
  return nodeLabel;
};

