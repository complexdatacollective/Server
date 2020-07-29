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
        return faker.random.name();
      }
      return faker.random.word();
    }
  }
};

const generateNodes = (number, type, codebookVariables) => {
  const makeNode = () => {
    const mockAttributes = Object.entries(codebookVariables).reduce(
      (acc, [variableId, variable]) => {
        acc[variableId] = mockValue(variable);
        return acc;
      }, {},
    );

    const modelData = {
      [nodePrimaryKeyProperty]: uuidv4(),
      type,
    };

    return {
      ...modelData,
      [nodeAttributesProperty]: {
        ...mockAttributes,
      },
    };
  };

  return [...Array(number)].map((r, i) => ({
    uuid: uuidv4(),
    data: makeNode(),
  }));
};

const buildMockData = (
  protocol,
  sessionCount = 4500,
) => {
  const codebookNodeTypes = Object.keys(protocol.codebook.node);
  const codebookEdgeTypes = Object.keys(protocol.codebook.edge);

  const mockEdge = { from: 12, to: 11, type: 'friends' };

  const makeNetwork = (caseId) => {
    // Generate nodes
    const nodes = [];
    const networkMaxNodes = 40;
    const networkMinNodes = 4;
    const thisNetworkSize =
      Math.round(Math.random() * ((networkMaxNodes - networkMinNodes) + networkMinNodes));

    const nodesPerType = Math.round(thisNetworkSize / codebookNodeTypes.length);

    codebookNodeTypes.forEach((nodeType) => {
      nodes.push(generateNodes(nodesPerType, protocol.codebook.node[nodeType]));
    });

    const edges = [];
    const ego = {};
    // let edges = new Array(edgesPerSession);
    // edges.fill(mockEdge);

    // // Change last edge's property so we can search for it
    // if (edges.length) { edges[edges.length - 1].from = 13; }

    // if (useRealIds) {
    //   const pickNodeUid = () => nodes[~~(Math.random() * nodes.length)][nodePrimaryKeyProperty];
    //   edges = edges.map(edge => ({ ...edge, from: pickNodeUid(), to: pickNodeUid() }))
    // }

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
