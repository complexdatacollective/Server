const uuid = require('uuid/v4');
const faker = require('faker');
const { has, times } = require('lodash');
const crypto = require('crypto');
const objectHash = require('object-hash');

const {
  entityPrimaryKeyProperty,
  entityAttributesProperty,
  caseProperty,
  sessionProperty,
  protocolProperty,
  protocolName,
  // sessionStartTimeProperty,
  // sessionFinishTimeProperty,
  codebookHashProperty,
  sessionExportTimeProperty,
} = require('./network-exporters/src/utils/reservedAttributes');

const nameDigest = (name) => name && crypto.createHash('sha256').update(name).digest('hex');

const mockCoord = () => faker.random.number({ min: 0, max: 1, precision: 0.000001 });

// Todo: make these mock values reflect validation
const mockValue = (variable) => {
  switch (variable.type) {
    case 'boolean':
      return faker.random.boolean();
    case 'number':
      return faker.random.number({ min: 20, max: 100 });
    case 'scalar':
      return faker.random.number({ min: 0, max: 1, precision: 0.001 });
    case 'datetime':
      return faker.date.recent().toISOString().slice(0, 10);
    case 'ordinal':
      return faker.random.arrayElement(variable.options).value;
    case 'categorical':
      return [faker.random.arrayElement(variable.options).value];
    case 'layout':
      return { x: mockCoord(), y: mockCoord() };
    case 'text': {
      if (variable.name.toLowerCase() === 'name' || variable.name.toLowerCase().includes('name')) {
        return faker.name.findName();
      }

      if (variable.component && variable.component === 'TextArea') {
        return faker.lorem.paragraph();
      }
      return faker.random.word();
    }
    default:
      return faker.random.word();
  }
};

const makeEntity = (typeID, variables = {}, promptAttributes = {}) => {
  const mockAttributes = Object.entries(variables).reduce(
    (acc, [variableId, variable]) => {
      if (!has(promptAttributes, variableId)) {
        acc[variableId] = mockValue(variable);
      }
      return acc;
    }, {},
  );

  const modelData = {
    [entityPrimaryKeyProperty]: uuid(),
    promptIDs: ['mock'],
    stageId: 'mock',
    ...(typeID && { type: typeID }),
  };

  return {
    ...modelData,
    [entityAttributesProperty]: {
      ...mockAttributes,
    },
  };
};

const makeNetwork = (protocol) => {
  const codebookNodeTypes = Object.keys(protocol.codebook.node || {});
  const codebookEdgeTypes = Object.keys(protocol.codebook.edge || {});

  // Generate nodes
  const nodes = [];
  const networkMaxNodes = 20;
  const networkMinNodes = 2;

  codebookNodeTypes.forEach((nodeType) => {
    const nodesOfThisType = Math.round(
      Math.random() * ((networkMaxNodes - networkMinNodes) + networkMinNodes),
    );
    nodes.push(...[...Array(nodesOfThisType)].map(() => makeEntity(
      nodeType,
      protocol.codebook.node[nodeType].variables,
    )));
  });

  const ego = makeEntity(null, (protocol.codebook.ego || {}).variables);

  const edges = [];
  const networkMaxEdges = 20;
  const networkMinEdges = 1;
  // eslint-disable-next-line no-bitwise
  const pickNodeUid = () => nodes[~~(Math.random() * (nodes.length - 1))][entityPrimaryKeyProperty];

  codebookEdgeTypes.forEach((edgeType) => {
    const edgesOfThisType = Math.round(
      Math.random() * ((networkMaxEdges - networkMinEdges) + networkMinEdges),
    );

    edges.push(...[...Array(edgesOfThisType)].map(() => ({
      ...makeEntity(
        edgeType,
        protocol.codebook.edge[edgeType].variables,
      ),
      from: pickNodeUid(),
      to: pickNodeUid(),
    })));
  });

  return {
    nodes,
    edges,
    ego,
  };
};

const makeSession = (protocol) => {
  const network = makeNetwork(protocol);
  const caseId = `${faker.lorem.words().replace(/ /g, '_')}_${faker.random.number()}`;
  const sessionId = uuid();

  const sessionVariables = {
    // These are needed by export?:
    [caseProperty]: caseId,
    [sessionProperty]: sessionId,
    [protocolProperty]: nameDigest(protocol.name),
    [sessionExportTimeProperty]: new Date().toISOString(),
    // These are needed by server?:
    [protocolName]: protocol.name,
    [codebookHashProperty]: objectHash(protocol.codebook),
  };

  return {
    uuid: sessionId,
    data: {
      sessionVariables,
      ...network,
    },
  };
};

const buildMockData = (
  protocol,
  sessionCount = 4500,
) => times(sessionCount, () => makeSession(protocol));

module.exports = {
  buildMockData,
};
