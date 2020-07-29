/**
 * basic scaling tests for nedb
 *
 * notes:
 * - Node Crashes on DB size >256MB because of serialization
 *   + e.g., will not init.
 *   + This won't be an issue "soon" on 64-bit machines
 *     + [as of Chromium: 62](https://stackoverflow.com/a/47781288)
 *     + [electron2.0.2 is at Chromium 61](http://electronjs.org)
 *   + Easy repro: set SessionCount to 30k and run.
 *     + or set to 15k and run twice. (auto-compaction not working as advertised?)
 *     + note that [lack of] compaction makes this worse, but with mostly immutable data, matters less?
 *   + Can get in a state where app would never [re-]start, but underlying data is uncorrupted.
 * - everything grows linearly with SessionCount (init, insert, find, count)
 *   + init & insert probably grow linearly with total size
 *   + find & inner counts probably depend on query
 * - insert is atomic, hits inherent serialization limit for a certain insert (string length)
 */

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
    (acc, [variableId, variable]) => {
      acc[variableId] = mockValue(variable);
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
  sessionCount = 500,
) => {
  const codebookNodeTypes = Object.keys(protocol.codebook.node);
  const codebookEdgeTypes = Object.keys(protocol.codebook.edge);

  const makeNetwork = (caseId) => {
    // Generate nodes
    const nodes = [];
    const networkMaxNodes = 40;
    const networkMinNodes = 4;
    const thisNetworkSize =
      Math.round(Math.random() * ((networkMaxNodes - networkMinNodes) + networkMinNodes));

    const nodesPerType = Math.round(thisNetworkSize / codebookNodeTypes.length);

    codebookNodeTypes.forEach((nodeType) => {
      nodes.push([...Array(nodesPerType)].map(() => makeEntity(nodeType, protocol.codebook.node[nodeType].variables)));
    });

    const ego = makeEntity(null, protocol.codebook.ego.variables);

    const edges = [];
    const networkMaxEdges = 40;
    const networkMinEdges = 1;
    const pickNodeUid = () => nodes[~~(Math.random() * nodes.length)][nodePrimaryKeyProperty];

    codebookEdgeTypes.forEach((edgeType) => {
      const edgesOfThisType =
        Math.round(Math.random() * ((networkMaxEdges - networkMinEdges) + networkMinEdges));

      edges.push([...Array(edgesOfThisType)].map(() => ({
        ...makeEntity(edgeType, protocol.codebook.edge[edgeType].variables),
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
