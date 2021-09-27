const dom = require('xmldom');
const { ErrorMessages, RequestError } = require('../errors/RequestError');
const {
  caseProperty,
  entityPrimaryKeyProperty,
  protocolProperty,
  protocolName,
  ncTypeProperty,
  ncUUIDProperty,
  ncSourceUUID,
  ncTargetUUID,
  codebookHashProperty,
  sessionStartTimeProperty,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
} = require('./network-exporters/src/utils/reservedAttributes');

// TODO: Update this to validate against XML Schema: https://github.com/complexdatacollective/graphml-schemas
const validateGraphML = (bufferContents) => {
  const xmlDoc = new dom.DOMParser().parseFromString(bufferContents.toString(), 'text/xml');

  // basic header validation
  const graphml = xmlDoc.getElementsByTagName('graphml');
  if (!graphml || !graphml[0] || graphml[0].getAttribute('xmlns:nc') !== 'http://schema.networkcanvas.com/xmlns'
    || graphml[0].getAttribute('xmlns') !== 'http://graphml.graphdrawing.org/xmlns'
  ) {
    throw new RequestError(`${ErrorMessages.InvalidSessionFormat}: missing headers`);
  }

  // all graphs within the graphml must have the same protocol
  const graphs = graphml[0].getElementsByTagName('graph');
  if (graphs < 1) {
    throw new RequestError(`${ErrorMessages.InvalidSessionFormat}: missing graph`);
  }
  let graphmlProtocolId;
  Array.from(graphs).forEach((graph) => {
    const protocolId = graph.getAttribute(`nc:${protocolProperty}`);
    if (!graphmlProtocolId) {
      graphmlProtocolId = protocolId;
    } else if (graphmlProtocolId !== protocolId) {
      throw new RequestError(`${ErrorMessages.InvalidSessionFormat}: may only contain one protocol`);
    }
  });

  return xmlDoc;
};

// this is a string (name) in graphml, but uuid in export from NC to Server
const lookUpEntityType = (entityElement, codebookEntity) => {
  let typeUUID = '';

  Array.from(entityElement).forEach((entityData) => {
    if (entityData.nodeType === 1) {
      const keyValue = entityData.getAttributeNode('key').value;
      if (keyValue === ncTypeProperty) {
        typeUUID = Object.keys(codebookEntity).find(
          (key) => codebookEntity[key].name === entityData.textContent,
        );
        typeUUID = typeUUID || entityData.textContent;
      }
    }
  });
  return typeUUID;
};

const processVariable = (element, entity, xmlDoc, codebookEntity, entityType = '') => {
  let keyValue = element.getAttributeNode('key').value;
  if (keyValue === ncUUIDProperty) {
    // eslint-disable-next-line no-underscore-dangle
    return { ...entity, [entityPrimaryKeyProperty]: element.textContent };
  } if (keyValue === 'label') {
    // can ignore since this was just for gephi
    return entity;
  } if (keyValue === ncTypeProperty) {
    return { ...entity, type: entityType };
  } if (keyValue === ncSourceUUID) {
    return { ...entity, from: element.textContent };
  } if (keyValue === ncTargetUUID) {
    return { ...entity, to: element.textContent };
  } if (!keyValue.includes('_')) {
    const graphmlKey = xmlDoc.getElementById(keyValue);
    let text = element.textContent;
    switch (graphmlKey.getAttributeNode('attr.type').value) {
      case 'int':
      case 'double':
      case 'float':
        text = !Number.isNaN(Number(text)) ? Number(text) : text;
        break;
      case 'boolean':
        text = (text === 'true');
        break;
      case 'string':
      default:
        break;
    }
    // variables not in the codebook are external variables - use the name instead of uuid
    keyValue = codebookEntity.variables[keyValue] ? keyValue : graphmlKey.getAttributeNode('attr.name').value;
    return { ...entity, attributes: { ...entity.attributes, [keyValue]: text } };
  } if (keyValue.endsWith('_X')) { // process locations
    const locationKey = keyValue.substring(0, keyValue.indexOf('_X'));
    const locationObject = (entity.attributes && entity.attributes[locationKey]) || {};
    const text = Number(element.textContent);
    return {
      ...entity,
      attributes: { ...entity.attributes, [locationKey]: { ...locationObject, x: text } },
    };
  } if (keyValue.endsWith('_Y')) { // process locations
    const locationKey = keyValue.substring(0, keyValue.indexOf('_Y'));
    const locationObject = (entity.attributes && entity.attributes[locationKey]) || {};
    const text = Number(element.textContent);
    return {
      ...entity,
      attributes: { ...entity.attributes, [locationKey]: { ...locationObject, y: text } },
    };
  }

  // process categorical vars
  if (element.textContent === 'true') {
    const catKey = keyValue.substring(0, keyValue.indexOf('_'));
    const catVar = (entity.attributes && entity.attributes[catKey]) || []; // previous options
    const codebookVarName = codebookEntity.variables[catKey].name;
    const codebookOptions = codebookEntity.variables[catKey].options || [];
    const catValue = xmlDoc.getElementById(keyValue).getAttributeNode('attr.name').value; // variable_option
    const optionIndex = codebookVarName.length + 1; // add one for the underscore
    // fallback to using whatever is after the first underscore
    const optionValue = optionIndex > 0 ? catValue.substring(optionIndex) : catValue.substring(catValue.indexOf('_') + 1);
    // lookup in codebook the option's values (because numbers could be strings here)
    const codebookOption = codebookOptions.find(option => option.value.toString() === optionValue);
    // fallback to graphml value if not matched in codebook
    const codebookOptionValue = (codebookOption && codebookOption.value) || optionValue;
    catVar.push(codebookOptionValue);
    return { ...entity, attributes: { ...entity.attributes, [catKey]: catVar } };
  }
  return entity;
};

const convertGraphML = (xmlDoc, protocol) => {
  const graphml = xmlDoc.getElementsByTagName('graphml');

  const sessions = [];
  const graphs = graphml[0].getElementsByTagName('graph');
  const protocolId = graphs && graphs[0].getAttribute(`nc:${protocolProperty}`);
  Array.from(graphs).forEach((graph) => {
    // process session variables
    const session = {};
    const sessionId = graph.getAttribute('nc:sessionUUID');
    session.uuid = sessionId;
    session.data = {
      sessionVariables: {
        sessionId,
        [caseProperty]: graph.getAttribute(`nc:${caseProperty}`),
        [protocolProperty]: protocolId,
        [protocolName]: graph.getAttribute(`nc:${protocolName}`),
        [sessionExportTimeProperty]: graph.getAttribute('nc:sessionExportTime'),
        [sessionStartTimeProperty]: graph.getAttribute('nc:sessionStartTime'),
        [sessionFinishTimeProperty]: graph.getAttribute('nc:sessionFinishTime'),
        [codebookHashProperty]: graph.getAttribute(`nc:${codebookHashProperty}`),
      },
    };

    const entityElements = graph.childNodes;
    session.data.ego = {};
    session.data.ego.attributes = {};
    session.data.nodes = [];
    session.data.edges = [];
    for (let i = 0; i < entityElements.length; i += 1) {
      if (entityElements[i].nodeType === 1) {
        switch (entityElements[i].tagName) {
          case 'data': // process ego
            session.data.ego = processVariable(
              entityElements[i], session.data.ego, xmlDoc, protocol.codebook.ego,
            );
            break;
          case 'node': {
            const nodeElement = entityElements[i].childNodes;
            let node = {};
            node.attributes = {};
            const nodeType = lookUpEntityType(nodeElement, protocol.codebook.node);
            Array.from(nodeElement).forEach((nodeData) => {
              if (nodeData.nodeType === 1) {
                node = processVariable(
                  nodeData, node, xmlDoc, protocol.codebook.node[nodeType], nodeType,
                );
              }
            });
            session.data.nodes.push(node);
            break;
          }
          case 'edge': {
            const edgeElement = entityElements[i].childNodes;
            let edge = {};
            edge.attributes = {};
            const edgeType = lookUpEntityType(edgeElement, protocol.codebook.edge);
            Array.from(edgeElement).forEach((edgeData) => {
              if (edgeData.nodeType === 1) {
                edge = processVariable(
                  edgeData, edge, xmlDoc, protocol.codebook.edge[edgeType], edgeType,
                );
              }
            });
            session.data.edges.push(edge);
            break;
          }
          default:
            break;
        }
      }
    }
    sessions.push(session);
  });

  return { protocolId, sessions };
};

module.exports = {
  validateGraphML,
  convertGraphML,
};
