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

export const getNodeTypeDefinition = (codebook, node) => {
  const nodeType = get(node, 'type');
  return get(codebook, ['node', nodeType]);
};

export const getLabel = (codebook, node) => {
  const nodeTypeDefinition = getNodeTypeDefinition(codebook, node);
  const nodeLabel = labelLogic(nodeTypeDefinition, getEntityAttributes(node));
  return nodeLabel;
};

