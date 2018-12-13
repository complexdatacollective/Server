// Sharing Issues:
// - [ ] APIs (string output vs streaming); see saveFile()
// - [ ] need to abstract DOMParser
// - [ ] need to abstract XMLSerializer (see xmlToString())
// - [x] need directed as an option (until network encapsulates this)
// - [x] updated export (default/named)
// - [x] source data differs (we're working with resolved names in Server)
//    - this affects variable type lookup for nodes and labels for edges
// - [x] document is not global

const { DOMParser, XMLSerializer } = require('xmldom'); // TODO: these are globals in browser

const { findKey, forInRight, isNil } = require('lodash');

const { nodePrimaryKeyProperty, nodeAttributesProperty, getNodeAttributes } = require('./network');

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

// TODO: different API needed for server
const saveFile = xml => xml;

const getXmlHeader = (useDirectedEdges) => {
  const edgeDefault = useDirectedEdges ? 'directed' : 'undirected';
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<graphml xmlns="http://graphml.graphdrawing.org/xmlns"\n' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n' +
    'xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns\n' +
    'http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">\n' +
    `  <graph edgedefault="${edgeDefault}">\n`;
};

const xmlFooter = '</graph>\n</graphml>\n';

const setUpXml = (useDirectedEdges) => {
  const graphMLOutline = `${getXmlHeader(useDirectedEdges)}${xmlFooter}`;
  return (new DOMParser()).parseFromString(graphMLOutline, 'text/xml');
};

const getVariableDefinition = (variables, key) => {
  if (!variables) {
    return null;
  }
  if (variables[key]) {
    // NC: When dealing with variableIDs (not transposed), we have the match
    return variables[key];
  }
  // Server: need to look up based on name (transpose name back to ID)
  const entries = Object.entries(variables).find(([, variable]) => variable.name === key);
  return entries && entries[1];
};

const getVariableInfo = (variableRegistry, type, element, key) => (
  variableRegistry[type] &&
  variableRegistry[type][element.type] &&
  getVariableDefinition(variableRegistry[type][element.type].variables, key)
);

const variableRegistryExists = (variableRegistry, type, element, key) => {
  const variableInfo = getVariableInfo(variableRegistry, type, element, key);
  return variableInfo && variableInfo.type && VariableTypeValues.includes(variableInfo.type);
};

const getTypeFromVariableRegistry = (variableRegistry, type, element, key, variableAttribute = 'type') => {
  const variableInfo = getVariableInfo(variableRegistry, type, element, key);
  return variableInfo && variableInfo[variableAttribute];
};

// returns a graphml type
const getTypeForKey = (data, key) => (
  data.reduce((result, value) => {
    const attrs = getNodeAttributes(value);
    if (isNil(attrs[key])) return result;
    let currentType = typeof attrs[key];
    if (currentType === 'number') {
      currentType = Number.isInteger(attrs[key]) ? 'integer' : 'double';
      if (result && currentType !== result) return 'double';
    }
    if (String(Number.parseInt(attrs[key], 10)) === attrs[key]) {
      currentType = 'integer';
      if (result === 'double') return 'double';
    } else if (String(Number.parseFloat(attrs[key], 10)) === attrs[key]) {
      currentType = 'double';
      if (result === 'integer') return 'double';
    }
    if (isNil(currentType)) return result;
    if (currentType === result || result === '') return currentType;
    return 'string';
  }, ''));

// @return {Object} a fragment to insert, and any variables that were missing from the variable
//                  registry: `{ fragment: <DocumentFragment>, missingVariables: [] }`.
const generateKeyElements = (
  document, // the XML ownerDocument
  entities, // networkData.nodes or edges
  type, // 'node' or 'edge'
  excludeList, // Variables to exlude
  variableRegistry, // variable registry
  layoutVariable, // boolean value uses for edges?
) => {
  const fragment = document.createDocumentFragment();

  // generate keys for attributes
  const missingVariables = [];
  const done = [];

  // add keys for gephi positions
  if (layoutVariable) {
    const xElement = document.createElement('key');
    xElement.setAttribute('id', 'x');
    xElement.setAttribute('attr.name', 'x');
    xElement.setAttribute('attr.type', 'double');
    xElement.setAttribute('for', type);
    fragment.appendChild(xElement);
    const yElement = document.createElement('key');
    yElement.setAttribute('id', 'y');
    yElement.setAttribute('attr.name', 'y');
    yElement.setAttribute('attr.type', 'double');
    yElement.setAttribute('for', type);
    fragment.appendChild(yElement);
  }

  if (type === 'edge') {
    const label = document.createElement('key');
    label.setAttribute('id', 'label');
    label.setAttribute('attr.name', 'label');
    label.setAttribute('attr.type', 'string');
    label.setAttribute('for', type);
    fragment.appendChild(label);
  }

  entities.forEach((element) => {
    let iterableElement = element;
    if (type === 'node') {
      iterableElement = getNodeAttributes(element);
    }
    // Node data model attributes are now stored under a specific propertyy

    Object.keys(iterableElement).forEach((key) => {
      // transpose ids to names based on registry; fall back to the raw key
      // (Server does not need transposing.)
      const keyName = getTypeFromVariableRegistry(variableRegistry, type, element, key, 'name') || key;
      if (done.indexOf(keyName) === -1 && !excludeList.includes(keyName)) {
        const keyElement = document.createElement('key');
        keyElement.setAttribute('id', keyName);
        keyElement.setAttribute('attr.name', keyName);

        if (!variableRegistryExists(variableRegistry, type, element, key)) {
          missingVariables.push(`"${key}" in ${type}.${element.type}`);
        }

        const variableType = getTypeFromVariableRegistry(variableRegistry, type, element, key);
        switch (variableType) {
          case VariableType.boolean:
            keyElement.setAttribute('attr.type', variableType);
            break;
          case VariableType.ordinal:
          case VariableType.number: {
            const keyType = getTypeForKey(entities, key);
            keyElement.setAttribute('attr.type', keyType);
            break;
          }
          case VariableType.layout: {
            // special handling for locations
            keyElement.setAttribute('attr.name', `${keyName}Y`);
            keyElement.setAttribute('id', `${keyName}Y`);
            keyElement.setAttribute('attr.type', 'double');
            const keyElement2 = document.createElement('key');
            keyElement2.setAttribute('id', `${keyName}X`);
            keyElement2.setAttribute('attr.name', `${keyName}X`);
            keyElement2.setAttribute('attr.type', 'double');
            keyElement2.setAttribute('for', type);
            fragment.appendChild(keyElement2);
            break;
          }
          case VariableType.text:
          case VariableType.datetime:
          case VariableType.categorical:
          case VariableType.location: // TODO: special handling?
          default:
            keyElement.setAttribute('attr.type', 'string');
        }
        keyElement.setAttribute('for', type);
        fragment.appendChild(keyElement);
        done.push(keyName);
      }
    });
  });
  return {
    fragment,
    missingVariables,
  };
};

const getDataElement = (document, key, text) => {
  const data = document.createElement('data');
  data.setAttribute('key', key);
  data.appendChild(document.createTextNode(text));
  return data;
};

// @return {DocumentFragment} a fragment containing all XML elements for the supplied dataList
const generateDataElements = (
  document, // the XML ownerDocument
  dataList, // List of nodes or edges
  type, // Element type to be created. "node" or "egde"
  excludeList, // Attributes to exclude lookup of in variable registry
  variableRegistry, // Copy of variable registry
  layoutVariable, // Primary layout variable. Null for edges
) => {
  const fragment = document.createDocumentFragment();

  dataList.forEach((dataElement, index) => {
    const domElement = document.createElement(type);
    const nodeAttrs = getNodeAttributes(dataElement);

    if (dataElement[nodePrimaryKeyProperty]) {
      domElement.setAttribute('id', dataElement[nodePrimaryKeyProperty]);
    } else {
      domElement.setAttribute('id', index);
    }

    if (type === 'edge') {
      domElement.setAttribute('source', dataElement.from);
      domElement.setAttribute('target', dataElement.to);
    }
    fragment.appendChild(domElement);

    if (type === 'edge') {
      let label = variableRegistry && variableRegistry[type] &&
        variableRegistry[type][dataElement.type] && (variableRegistry[type][dataElement.type].name
          || variableRegistry[type][dataElement.type].label);

      // If we couldn't find a transposition, use the key directly.
      // This will be the case on Server (and `type` will already contain the name).
      if (!label) {
        label = dataElement.type;
      }

      domElement.appendChild(getDataElement(document, 'label', label));

      Object.keys(dataElement).forEach((key) => {
        const keyName = getTypeFromVariableRegistry(variableRegistry, type, dataElement, key, 'name') || key;
        if (!excludeList.includes(keyName)) {
          if (typeof dataElement[key] !== 'object') {
            domElement.appendChild(getDataElement(document, keyName, dataElement[key]));
          } else if (getTypeFromVariableRegistry(variableRegistry, type, dataElement, key) === 'layout') {
            domElement.appendChild(getDataElement(document, `${keyName}X`, dataElement[key].x));
            domElement.appendChild(getDataElement(document, `${keyName}Y`, dataElement[key].y));
          } else {
            domElement.appendChild(
              getDataElement(document, keyName, JSON.stringify(dataElement[key])),
            );
          }
        }
      });
    }

    // Add node attributes
    if (type === 'node') {
      Object.keys(nodeAttrs).forEach((key) => {
        const keyName = getTypeFromVariableRegistry(variableRegistry, type, dataElement, key, 'name') || key;
        if (!excludeList.includes(keyName)) {
          if (typeof nodeAttrs[key] !== 'object') {
            domElement.appendChild(
              getDataElement(document, keyName, nodeAttrs[key]));
          } else if (getTypeFromVariableRegistry(variableRegistry, type, dataElement, key) === 'layout') {
            domElement.appendChild(getDataElement(document, `${keyName}X`, nodeAttrs[key].x));
            domElement.appendChild(getDataElement(document, `${keyName}Y`, nodeAttrs[key].y));
          } else {
            domElement.appendChild(
              getDataElement(document, keyName, JSON.stringify(nodeAttrs[key])));
          }
        }
      });
    }

    // Add positions for gephi layout. Use window dimensions for scaling if available.
    if (layoutVariable && nodeAttrs[layoutVariable]) {
      let canvasWidth = 1024;
      let canvasHeight = 768;
      if (typeof window !== 'undefined') {
        canvasWidth = window.innerWidth; // eslint-disable-line no-undef
        canvasHeight = window.innerHeight; // eslint-disable-line no-undef
      }
      domElement.appendChild(getDataElement(document, 'x', nodeAttrs[layoutVariable].x * canvasWidth));
      domElement.appendChild(getDataElement(document, 'y', (1.0 - nodeAttrs[layoutVariable].y) * canvasHeight));
    }
  });

  return fragment;
};

const xmlToString = xmlData => new XMLSerializer().serializeToString(xmlData);

// const xmlToString = (xmlData) => {
//   let xmlString;
//   if (window.ActiveXObject) { // IE
//     xmlString = xmlData.xml;
//   } else { // code for Mozilla, Firefox, Opera, etc.
//     xmlString = (new window.XMLSerializer()).serializeToString(xmlData);
//   }
//   return xmlString;
// };

const createGraphML = (networkData, variableRegistry, onError, useDirectedEdges) => {
  // default graph structure
  const xml = setUpXml(useDirectedEdges);
  const graph = xml.getElementsByTagName('graph')[0];
  const graphML = xml.getElementsByTagName('graphml')[0];

  // find the first variable of type layout
  let layoutVariable;
  forInRight(variableRegistry.node, (value) => {
    layoutVariable = findKey(value.variables, { type: 'layout' });
  });

  // generate keys for nodes
  const { missingVariables: missingNodeVars, fragment: nodeKeyFragment } = generateKeyElements(
    graph.ownerDocument,
    networkData.nodes,
    'node',
    [nodePrimaryKeyProperty],
    variableRegistry,
    layoutVariable,
  );
  graphML.insertBefore(nodeKeyFragment, graph);

  // generate keys for edges and add to keys for nodes
  const { missingVariables: missingEdgeVars, fragment: edgeKeyFragment } = generateKeyElements(
    graph.ownerDocument,
    networkData.edges,
    'edge',
    ['from', 'to', 'type'],
    variableRegistry,
  );
  graphML.insertBefore(edgeKeyFragment, graph);

  const missingVariables = [...missingNodeVars, ...missingEdgeVars];
  if (missingVariables.length > 0) {
    // hard fail if checking the registry fails
    // remove this to fall back to using "text" for unknowns
    // onError(`The variable registry seems to be missing
    // "type" of: ${join(missingVariables, ', ')}.`);
    // return null;
  }

  // add nodes and edges to graph
  const nodeFragment = generateDataElements(
    graph.ownerDocument,
    networkData.nodes,
    'node',
    [nodePrimaryKeyProperty, nodeAttributesProperty],
    variableRegistry,
    layoutVariable,
  );
  graph.appendChild(nodeFragment);

  const edgeFragment = generateDataElements(
    graph.ownerDocument,
    networkData.edges,
    'edge',
    ['from', 'to', 'type'],
    variableRegistry,
  );
  graph.appendChild(edgeFragment);

  return saveFile(xmlToString(xml), onError, 'graphml', ['graphml'], 'networkcanvas.graphml', 'text/xml',
    { message: 'Your network canvas graphml file.', subject: 'network canvas export' });
};

class GraphMLFormatter {
  constructor(data, useDirectedEdges, variableRegistry) {
    this.network = data;
    this.variableRegistry = variableRegistry;
    this.useDirectedEdges = useDirectedEdges;
  }
  toString() {
    return createGraphML(this.network, this.variableRegistry, null, this.useDirectedEdges);
  }
}

// Provides ES6 named + default imports via babel
Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = createGraphML;

exports.GraphMLFormatter = GraphMLFormatter;
exports.createGraphML = createGraphML;
