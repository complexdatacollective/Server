const uuidv4 = require('uuid/v4');
const faker = require('faker');

const nodePrimaryKeyProperty = '_uid';
const nodeAttributesProperty = 'attributes';
const caseProperty = '_caseID';

const mockCoord = () => faker.random.number({ min: 0, max: 1, precision: 0.000001 });

// Todo: make these mock values reflect validation
// Todo: include date time
const mockValue = (nodeVariable) => {
  switch (nodeVariable.type) {
    case 'boolean':
      return faker.random.boolean();
    case 'number':
      return faker.random.number({ min: 20, max: 100 });
    case 'ordinal':
      return faker.random.arrayElement(nodeVariable.options).value;
    case 'categorical':
      return [faker.random.arrayElement(nodeVariable.options).value];
    case 'layout':
      return { x: mockCoord(), y: mockCoord() };
    default: {
      if (nodeVariable.name === 'name') {
        return faker.name.findName();
      }
      return faker.random.word();
    }
  }
};

const makeEntity = (type, variables) => {
  const mockAttributes = Object.entries(variables).reduce(
    // eslint-disable-next-line no-unused-vars
    (acc, [variableId, variable]) => {
      acc[variable.name] = mockValue(variable);
      return acc;
    }, {},
  );

  const modelData = {
    [nodePrimaryKeyProperty]: uuidv4(),
    ...(type && { type }),
  };

  return {
    ...modelData,
    [nodeAttributesProperty]: {
      ...mockAttributes,
    },
  };
};

const buildMockData = (
  protocol,
  sessionCount = 4500,
) => {
  const codebookNodeTypes = Object.keys(protocol.codebook.node);
  const codebookEdgeTypes = Object.keys(protocol.codebook.edge);

  const makeNetwork = (caseId) => {
    // Generate nodes
    const nodes = [];
    const networkMaxNodes = 20;
    const networkMinNodes = 2;

    codebookNodeTypes.forEach((nodeType) => {
      const nodesOfThisType =
        Math.round(Math.random() * ((networkMaxNodes - networkMinNodes) + networkMinNodes));
      nodes.push(...[...Array(nodesOfThisType)].map(() =>
        makeEntity(
          protocol.codebook.node[nodeType].name,
          protocol.codebook.node[nodeType].variables,
        )));
    });

    const ego = makeEntity(null, protocol.codebook.ego.variables);

    const edges = [];
    const networkMaxEdges = 20;
    const networkMinEdges = 1;
    // eslint-disable-next-line no-bitwise
    const pickNodeUid = () => nodes[~~(Math.random() * nodes.length)][nodePrimaryKeyProperty];

    codebookEdgeTypes.forEach((edgeType) => {
      const edgesOfThisType =
        Math.round(Math.random() * ((networkMaxEdges - networkMinEdges) + networkMinEdges));

      edges.push(...[...Array(edgesOfThisType)].map(() => ({
        ...makeEntity(
          protocol.codebook.edge[edgeType].name,
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
      sessionVariables: { [caseProperty]: `a_${caseId}` },
    };
  };

  return [...Array(sessionCount)].map((r, i) => ({
    uuid: uuidv4(),
    data: makeNetwork(i),
  }));
};

module.exports = {
  buildMockData,
};
