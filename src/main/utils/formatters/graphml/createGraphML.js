// Sharing Issues:
// - [ ] APIs (string output vs streaming); see saveFile()
//    - Change in signature: NetworkCanvas must inject saveFile as a final arg
// - [ ] linebreak handling?
// - [x] need to abstract DOMParser
// - [x] need to abstract XMLSerializer (see xmlToString())
// - [x] need directed as an option (until network encapsulates this)
// - [x] updated export (default/named)
// - [x] source data differs (we're working with resolved names in Server)
//    - this affects variable type lookup for nodes and labels for edges
// - [x] document is not global

const { findKey, forInRight } = require('lodash');

const { nodePrimaryKeyProperty, nodeAttributesProperty, getNodeAttributes } = require('../network');
const {
  createDataElement,
  getGraphMLTypeForKey,
  getTypeFromVariableRegistry,
  variableRegistryExists,
  VariableType,
} = require('./helpers');

// In a browser process, window provides a globalContext;
// in an electron main process, we can inject required globals
let globalContext;

/* eslint-disable no-undef, global-require */
if (typeof window !== 'undefined' && window.DOMParser && window.XMLSerializer) {
  globalContext = window;
} else {
  const dom = require('xmldom');
  globalContext = {};
  globalContext.DOMParser = dom.DOMParser;
  globalContext.XMLSerializer = dom.XMLSerializer;
}
/* eslint-enable */

const eol = '\n';

const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
  <graphml xmlns="http://graphml.graphdrawing.org/xmlns"
           xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
           xsi:schemaLocation="http://graphml.graphdrawing.org/xmlns
           http://graphml.graphdrawing.org/xmlns/1.0/graphml.xsd">${eol}`;

const getGraphHeader = (useDirectedEdges) => {
  const edgeDefault = useDirectedEdges ? 'directed' : 'undirected';
  return `<graph edgedefault="${edgeDefault}">${eol}`;
};

const xmlFooter = `</graph>${eol}</graphml>${eol}`;

const setUpXml = (useDirectedEdges) => {
  const graphMLOutline = `${xmlHeader}${getGraphHeader(useDirectedEdges)}${xmlFooter}`;
  return (new globalContext.DOMParser()).parseFromString(graphMLOutline, 'text/xml');
};

// <key> elements provide the type definitions for GraphML data elements
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
            const keyType = getGraphMLTypeForKey(entities, key);
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

      domElement.appendChild(createDataElement(document, 'label', label));

      Object.keys(dataElement).forEach((key) => {
        const keyName = getTypeFromVariableRegistry(variableRegistry, type, dataElement, key, 'name') || key;
        if (!excludeList.includes(keyName)) {
          if (typeof dataElement[key] !== 'object') {
            domElement.appendChild(createDataElement(document, keyName, dataElement[key]));
          } else if (getTypeFromVariableRegistry(variableRegistry, type, dataElement, key) === 'layout') {
            domElement.appendChild(createDataElement(document, `${keyName}X`, dataElement[key].x));
            domElement.appendChild(createDataElement(document, `${keyName}Y`, dataElement[key].y));
          } else {
            domElement.appendChild(
              createDataElement(document, keyName, JSON.stringify(dataElement[key])),
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
            domElement.appendChild(createDataElement(document, keyName, nodeAttrs[key]));
          } else if (getTypeFromVariableRegistry(variableRegistry, type, dataElement, key) === 'layout') {
            domElement.appendChild(createDataElement(document, `${keyName}X`, nodeAttrs[key].x));
            domElement.appendChild(createDataElement(document, `${keyName}Y`, nodeAttrs[key].y));
          } else {
            domElement.appendChild(
              createDataElement(document, keyName, JSON.stringify(nodeAttrs[key])));
          }
        }
      });
    }

    // Add positions for gephi layout. Use window dimensions for scaling if available.
    if (layoutVariable && nodeAttrs[layoutVariable]) {
      const canvasWidth = globalContext.innerWidth || 1024;
      const canvasHeight = globalContext.innerHeight || 768;
      domElement.appendChild(createDataElement(document, 'x', nodeAttrs[layoutVariable].x * canvasWidth));
      domElement.appendChild(createDataElement(document, 'y', (1.0 - nodeAttrs[layoutVariable].y) * canvasHeight));
    }
  });

  return fragment;
};

// Generator to supply XML content in chunks to both string and stream producers
function* graphMLGenerator(networkData, variableRegistry, useDirectedEdges) {
  const serializer = new globalContext.XMLSerializer();
  const serialize = fragment => `${serializer.serializeToString(fragment)}${eol}`;

  yield xmlHeader;

  const xmlDoc = setUpXml(useDirectedEdges);

  // find the first variable of type layout
  let layoutVariable;
  forInRight(variableRegistry.node, (value) => {
    layoutVariable = findKey(value.variables, { type: 'layout' });
  });

  // generate keys for nodes
  const { missingVariables: missingNodeVars, fragment: nodeKeyFragment } = generateKeyElements(
    xmlDoc,
    networkData.nodes,
    'node',
    [nodePrimaryKeyProperty],
    variableRegistry,
    layoutVariable,
  );
  yield serialize(nodeKeyFragment);

  // generate keys for edges and add to keys for nodes
  const { missingVariables: missingEdgeVars, fragment: edgeKeyFragment } = generateKeyElements(
    xmlDoc,
    networkData.edges,
    'edge',
    ['from', 'to', 'type'],
    variableRegistry,
  );

  const missingVariables = [...missingNodeVars, ...missingEdgeVars];
  if (missingVariables.length > 0) {
    // hard fail if checking the registry fails
    // remove this to fall back to using "text" for unknowns
    // throw new Error(`The variable registry seems to be missing
    // "type" of: ${join(missingVariables, ', ')}.`);
    // return null;
  }

  yield serialize(edgeKeyFragment);

  yield getGraphHeader(useDirectedEdges);

  // add nodes and edges to graph
  const nodeFragment = generateDataElements(
    xmlDoc,
    networkData.nodes,
    'node',
    [nodePrimaryKeyProperty, nodeAttributesProperty],
    variableRegistry,
    layoutVariable,
  );
  yield serialize(nodeFragment);

  const edgeFragment = generateDataElements(
    xmlDoc,
    networkData.edges,
    'edge',
    ['from', 'to', 'type'],
    variableRegistry,
  );
  yield serialize(edgeFragment);

  yield xmlFooter;
}

/**
 * @throws
 */
const buildGraphML = (networkData, variableRegistry, useDirectedEdges) => {
  // TODO: stream
  let xmlString = '';
  for (const chunk of graphMLGenerator(networkData, variableRegistry, useDirectedEdges)) { // eslint-disable-line
    xmlString += chunk;
  }
  return xmlString;
};

/**
 * Network Canvas interface for ExportData
 * @param  {Object} networkData network from redux state
 * @param  {Object} variableRegistry from protocol in redux state
 * @param  {Function} onError
 * @param  {Function} saveFile injected SaveFile dependency (called with the xml contents)
 * @return {} the return value from saveFile
 */
const createGraphML = (networkData, variableRegistry, onError, saveFile) => {
  let xmlString = '';
  try {
    for (const chunk of graphMLGenerator(networkData, variableRegistry)) { // eslint-disable-line
      xmlString += chunk;
    }
  } catch (err) {
    onError(err);
    return null;
  }
  return saveFile(
    xmlString,
    onError,
    'graphml',
    ['graphml'],
    'networkcanvas.graphml',
    'text/xml',
    { message: 'Your network canvas graphml file.', subject: 'network canvas export' },
  );
};


// Provides ES6 named + default imports via babel
Object.defineProperty(exports, '__esModule', {
  value: true,
});

exports.default = createGraphML;

exports.createGraphML = createGraphML;
exports.buildGraphML = buildGraphML;
