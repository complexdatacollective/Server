const { getNodeAttributes } = require('../network');
const { isNil } = require('lodash');

// TODO: VariableType[Values] is shared with 'protocol-consts' in NC
const VariableType = Object.freeze({
  boolean: 'boolean',
  text: 'text',
  number: 'number',
  datetime: 'datetime',
  ordinal: 'ordinal',
  categorical: 'categorical',
  layout: 'layout',
  location: 'location',
});

const VariableTypeValues = Object.freeze(Object.values(VariableType));

// returns a graphml type
const getGraphMLTypeForKey = (data, key) => (
  data.reduce((result, value) => {
    const attrs = getNodeAttributes(value);
    if (isNil(attrs[key])) return result;
    let currentType = typeof attrs[key];
    if (currentType === 'number') {
      currentType = Number.isInteger(attrs[key]) ? 'int' : 'double';
      if (result && currentType !== result) return 'double';
    }
    if (String(Number.parseInt(attrs[key], 10)) === attrs[key]) {
      currentType = 'int';
      if (result === 'double') return 'double';
    } else if (String(Number.parseFloat(attrs[key], 10)) === attrs[key]) {
      currentType = 'double';
      if (result === 'int') return 'double';
    }
    if (isNil(currentType)) return result;
    if (currentType === result || result === '') return currentType;
    return 'string';
  }, ''));

const getVariableInfo = (variableRegistry, type, element, key) => (
  variableRegistry[type] &&
  variableRegistry[type][element.type] &&
  variableRegistry[type][element.type].variables &&
  variableRegistry[type][element.type].variables[key]
);

const variableRegistryExists = (variableRegistry, type, element, key) => {
  const variableInfo = getVariableInfo(variableRegistry, type, element, key);
  return variableInfo && variableInfo.type && VariableTypeValues.includes(variableInfo.type);
};

const getTypeFromVariableRegistry = (variableRegistry, type, element, key, variableAttribute = 'type') => {
  const variableInfo = getVariableInfo(variableRegistry, type, element, key);
  return variableInfo && variableInfo[variableAttribute];
};

const createElement = (xmlDoc, tagName, attrs = {}, child = null) => {
  const element = xmlDoc.createElement(tagName);
  Object.entries(attrs).forEach(([key, val]) => {
    element.setAttribute(key, val);
  });
  if (child) {
    element.appendChild(child);
  }
  return element;
};

const createDataElement = (xmlDoc, key, text) =>
  createElement(xmlDoc, 'data', { key }, xmlDoc.createTextNode(text));

exports.createDataElement = createDataElement;
exports.getGraphMLTypeForKey = getGraphMLTypeForKey;
exports.getTypeFromVariableRegistry = getTypeFromVariableRegistry;
exports.variableRegistryExists = variableRegistryExists;
exports.VariableType = VariableType;
