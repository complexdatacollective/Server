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

const { findKey, forInRight, includes } = require('lodash');
const uuid = require('uuid');

const { nodePrimaryKeyProperty, nodeAttributesProperty, getEntityAttributes } = require('../network');
const {
  createDataElement,
  getGraphMLTypeForKey,
  getTypeFromCodebook,
  codebookExists,
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
//                  codebook: `{ fragment: <DocumentFragment>, missingVariables: [] }`.
const generateKeyElements = (
  document, // the XML ownerDocument
  entities, // networkData.nodes or edges
  type, // 'node' or 'edge'
  excludeList, // Variables to exlude
  codebook, // codebook
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
    iterableElement = getEntityAttributes(element);
    // Entity data model attributes are now stored under a specific property

    Object.keys(iterableElement).forEach((key) => {
      // transpose ids to names based on codebook; fall back to the raw key
      const keyName = getTypeFromCodebook(codebook, type, element, key, 'name') || key;
      if (done.indexOf(keyName) === -1 && !excludeList.includes(keyName)) {
        const keyElement = document.createElement('key');
        keyElement.setAttribute('id', keyName);
        keyElement.setAttribute('attr.name', keyName);

        if (!codebookExists(codebook, type, element, key)) {
          missingVariables.push(`"${key}" in ${type}.${element.type}`);
        }

        const variableType = getTypeFromCodebook(codebook, type, element, key);
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
          case VariableType.categorical: {
            const options = getTypeFromCodebook(codebook, type, element, key, 'options');
            options.forEach((option, index) => {
              if (index === options.length - 1) {
                keyElement.setAttribute('id', `${keyName}_${option.value}`);
                keyElement.setAttribute('attr.name', `${keyName}_${option.value}`);
                keyElement.setAttribute('attr.type', 'boolean');
              } else {
                const keyElement2 = document.createElement('key');
                keyElement2.setAttribute('id', `${keyName}_${option.value}`);
                keyElement2.setAttribute('attr.name', `${keyName}_${option.value}`);
                keyElement2.setAttribute('attr.type', 'boolean');
                keyElement2.setAttribute('for', type);
                fragment.appendChild(keyElement2);
              }
            });
            break;
          }
          case VariableType.text:
          case VariableType.datetime:
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
  excludeList, // Attributes to exclude lookup of in codebook
  codebook, // Copy of codebook
  layoutVariable, // Primary layout variable. Null for edges
) => {
  const fragment = document.createDocumentFragment();

  dataList.forEach((dataElement) => {
    const domElement = document.createElement(type);
    const nodeAttrs = getEntityAttributes(dataElement);

    if (dataElement[nodePrimaryKeyProperty]) {
      domElement.setAttribute('id', dataElement[nodePrimaryKeyProperty]);
    } else {
      domElement.setAttribute('id', uuid());
    }

    if (type === 'edge') {
      domElement.setAttribute('source', dataElement.from);
      domElement.setAttribute('target', dataElement.to);
    }
    fragment.appendChild(domElement);

    if (type === 'edge') {
      const label = codebook && codebook[type] &&
        codebook[type][dataElement.type] && (codebook[type][dataElement.type].name
          || codebook[type][dataElement.type].label);

      domElement.appendChild(createDataElement(document, 'label', label));

      Object.keys(dataElement).forEach((key) => {
        const keyName = getTypeFromCodebook(codebook, type, dataElement, key, 'name') || key;
        if (!excludeList.includes(keyName)) {
          if (typeof dataElement[key] !== 'object') {
            domElement.appendChild(createDataElement(document, keyName, dataElement[key]));
          } else if (getTypeFromCodebook(codebook, type, dataElement, key) === 'layout') {
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

    // Add entity attributes
    Object.keys(nodeAttrs).forEach((key) => {
      const keyName = getTypeFromCodebook(codebook, type, dataElement, key, 'name') || key;
      if (!excludeList.includes(keyName) && !!nodeAttrs[key]) {
        if (getTypeFromCodebook(codebook, type, dataElement, key) === 'categorical') {
          const options = getTypeFromCodebook(codebook, type, dataElement, key, 'options');
          options.forEach((option) => {
            const optionKey = `${keyName}_${option.value}`;
            domElement.appendChild(createDataElement(
              document, optionKey, !!nodeAttrs[key] && includes(nodeAttrs[key], option.value)));
          });
        } else if (typeof nodeAttrs[key] !== 'object') {
          domElement.appendChild(createDataElement(document, keyName, nodeAttrs[key]));
        } else if (getTypeFromCodebook(codebook, type, dataElement, key) === 'layout') {
          domElement.appendChild(createDataElement(document, `${keyName}X`, nodeAttrs[key].x));
          domElement.appendChild(createDataElement(document, `${keyName}Y`, nodeAttrs[key].y));
        } else {
          domElement.appendChild(
            createDataElement(document, keyName, JSON.stringify(nodeAttrs[key])));
        }
      }
    });

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
function* graphMLGenerator(networkData, codebook, useDirectedEdges) {
  const serializer = new globalContext.XMLSerializer();
  const serialize = fragment => `${serializer.serializeToString(fragment)}${eol}`;

  yield xmlHeader;

  const xmlDoc = setUpXml(useDirectedEdges);

  // find the first variable of type layout
  let layoutVariable;
  forInRight(codebook.node, (value) => {
    layoutVariable = findKey(value.variables, { type: 'layout' });
  });

  const generateNodeKeys = nodes => generateKeyElements(
    xmlDoc,
    nodes,
    'node',
    [nodePrimaryKeyProperty],
    codebook,
    layoutVariable,
  );
  const generateEdgeKeys = edges => generateKeyElements(
    xmlDoc,
    edges,
    'edge',
    [nodePrimaryKeyProperty, 'from', 'to', 'type'],
    codebook,
  );
  const generateNodeElements = nodes => generateDataElements(
    xmlDoc,
    nodes,
    'node',
    [nodePrimaryKeyProperty, nodeAttributesProperty],
    codebook,
    layoutVariable,
  );
  const generateEdgeElements = edges => generateDataElements(
    xmlDoc,
    edges,
    'edge',
    [nodePrimaryKeyProperty, nodeAttributesProperty, 'from', 'to', 'type'],
    codebook,
  );

  // generate keys for nodes
  const {
    missingVariables: missingNodeVars,
    fragment: nodeKeyFragment,
  } = generateNodeKeys(networkData.nodes);
  yield serialize(nodeKeyFragment);

  // generate keys for edges and add to keys for nodes
  const {
    missingVariables: missingEdgeVars,
    fragment: edgeKeyFragment,
  } = generateEdgeKeys(networkData.edges);
  yield serialize(edgeKeyFragment); // after we've potentially thrown missingVariables

  const missingVariables = [...missingNodeVars, ...missingEdgeVars];
  if (missingVariables.length > 0) {
    // hard fail if checking the codebook fails
    // remove this to fall back to using "text" for unknowns
    // throw new Error(`The codebook seems to be missing
    // "type" of: ${join(missingVariables, ', ')}.`);
    // return null;
  }

  yield getGraphHeader(useDirectedEdges);

  // add nodes and edges to graph
  for (let i = 0; i < networkData.nodes.length; i += 100) {
    const nodeFragment = generateNodeElements(networkData.nodes.slice(i, i + 100));
    yield serialize(nodeFragment);
  }

  for (let i = 0; i < networkData.edges.length; i += 100) {
    const edgeFragment = generateEdgeElements(networkData.edges.slice(i, i + 100));
    yield serialize(edgeFragment);
  }

  yield xmlFooter;
}

/**
 * Network Canvas interface for ExportData
 * @param  {Object} networkData network from redux state
 * @param  {Object} codebook from protocol in redux state
 * @param  {Function} onError
 * @param  {Function} saveFile injected SaveFile dependency (called with the xml contents)
 * @return {} the return value from saveFile
 */
const createGraphML = (networkData, codebook, onError, saveFile) => {
  let xmlString = '';
  try {
    for (const chunk of graphMLGenerator(networkData, codebook)) { // eslint-disable-line
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
exports.graphMLGenerator = graphMLGenerator;
