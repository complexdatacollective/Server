/* eslint-env jest */
/* eslint-disable no-underscore-dangle */
const { DateTime } = require('luxon');
const {
  intersection,
  difference,
  isEqual,
  thru,
} = require('lodash');
const { Factory } = require('../../../../__factories__/Factory');
const { properties } = require('../helpers');
const {
  getSessionsByResolution,
  applyTransform,
  transformSessions,
} = require('../transformSessions');

expect.extend({
  networkIncludesNodes(network, nodeIds) {
    const networkNodeIds = network.nodes.map(node => node[properties.nodePrimaryKey]);

    const both = intersection(networkNodeIds, nodeIds);

    if (both.length === nodeIds.length) {
      return { pass: true };
    }

    const missing = difference(nodeIds, both);

    return {
      pass: false,
      message: () => `Network does not include all nodes [${missing}]`,
    };
  },
});

expect.extend({
  networkExcludesNodes(network, nodeIds) {
    const networkNodeIds = network.nodes.map(node => node[properties.nodePrimaryKey]);

    const both = intersection(networkNodeIds, nodeIds);

    if (both.length === 0) {
      return { pass: true };
    }

    return {
      pass: false,
      message: () => `Network contains nodes [${both}]`,
    };
  },
});

expect.extend({
  networkHasNode(network, id, attributes) {
    const node = network.nodes.find(n => n[properties.nodePrimaryKey] === id);

    if (!node) {
      return {
        pass: false,
        message: () => `Node ${id} not found`,
      };
    }

    const equal = isEqual(node[properties.nodeAttributes], attributes);

    if (equal) {
      return { pass: true };
    }

    return {
      pass: false,
      message: () => `Node with id ${id} found but attributes differ:

got:
${JSON.stringify(node[properties.nodeAttributes], null, 2)}

expected:
${JSON.stringify(attributes, null, 2)}`,
    };
  },
});

describe('getSessionsByResolution', () => {
  const resolutions = Object.freeze([
    { id: 'foo', transforms: [], nodes: [], date: DateTime.fromISO('2019-05-30').toJSDate() },
    { id: 'bar', transforms: [], nodes: [], date: DateTime.fromISO('2019-06-30').toJSDate() },
    { id: 'bazz', transforms: [], nodes: [], date: DateTime.fromISO('2019-07-30').toJSDate() },
    { id: 'buzz', transforms: [], nodes: [], date: DateTime.fromISO('2019-08-30').toJSDate() },
  ]);

  const sessions = Object.freeze([
    { nodes: [], edges: [], date: DateTime.fromISO('2019-05-25').toJSDate() },
    { nodes: [], edges: [], date: DateTime.fromISO('2019-05-26').toJSDate() },
    { nodes: [], edges: [], date: DateTime.fromISO('2019-06-25').toJSDate() },
    { nodes: [], edges: [], date: DateTime.fromISO('2019-06-26').toJSDate() },
    { nodes: [], edges: [], date: DateTime.fromISO('2019-06-27').toJSDate() },
    { nodes: [], edges: [], date: DateTime.fromISO('2019-09-25').toJSDate() },
    { nodes: [], edges: [], date: DateTime.fromISO('2019-09-26').toJSDate() },
  ]);

  it('groups session by resolution id', () => {
    const expectedResult = {
      foo: [
        { nodes: [], edges: [], date: DateTime.fromISO('2019-05-25').toJSDate() },
        { nodes: [], edges: [], date: DateTime.fromISO('2019-05-26').toJSDate() },
      ],
      bar: [
        { nodes: [], edges: [], date: DateTime.fromISO('2019-06-25').toJSDate() },
        { nodes: [], edges: [], date: DateTime.fromISO('2019-06-26').toJSDate() },
        { nodes: [], edges: [], date: DateTime.fromISO('2019-06-27').toJSDate() },
      ],
      _unresolved: [
        { nodes: [], edges: [], date: DateTime.fromISO('2019-09-25').toJSDate() },
        { nodes: [], edges: [], date: DateTime.fromISO('2019-09-26').toJSDate() },
      ],
    };

    expect(getSessionsByResolution(resolutions, sessions))
      .toEqual(expectedResult);
  });
});

describe('applyTransform', () => {
  const network = Object.freeze(
    thru(
      Factory.network.build(20),
      (network) => ({
        ...network,
        nodes: network.nodes.map(node => ({ ...node, caseId: ['1'] })),
      }),
    ),
  );

  const transform = Factory.transform.build({ attributes: { foo: 'bar' } }, { network });

  it("each node should be replaced with it's transform", () => {
    const newNetwork = applyTransform(network, transform); // resultant network

    // Nodes exist in network prior to resolution
    expect(network).networkIncludesNodes(transform.nodes);

    // Nodes are removed from the transformed network
    expect(newNetwork).networkExcludesNodes(transform.nodes);

    // Transformed node has been added to the transformed network
    expect(newNetwork)
      .networkHasNode(transform.id, transform.attributes);


    const newNode = newNetwork.nodes.find(({ _uid }) => _uid === transform.id);

    // New nodes should collect parentIds
    expect(newNode.parentId).toEqual(transform.nodes);

    //New nodes should collect caseIds?
    expect(newNode.caseId.length).toBe(1);
    expect(newNode.caseId).toEqual(network.nodes[0].caseId);
  });

  it('each edge should be updated with the new ids', () => {
    const { edges } = applyTransform(network, transform);
    const networkEdgeIds = network.edges.flatMap(({ from, to }) => [from, to]);
    const transformedNetworkEdgeIds = edges.flatMap(({ from, to }) => [from, to]);
    const mockTransformEdgeIds = networkEdgeIds
      .map(id => (transform.nodes.includes(id) ? transform.id : id));
    expect(transformedNetworkEdgeIds).toEqual(mockTransformEdgeIds);
  });
});

describe('transformSessions', () => {
  const protocol = {
    codebook: {
      node: {
        bar: {
          variables: {},
        },
      },
      ego: {
        variables: {},
      },
    },
  };

  it('applies a resolution to a session', () => {
    // Set up a single session with a resolution with a single transform
    const sessions = [Factory.session.build(null, { size: 5 })];
    const resolutions = [
      Factory.resolution.build(
        { date: DateTime.fromJSDate(sessions[0].date).plus({ days: 1 }).toJSDate() },
        { network: sessions[0], transformCount: 1, attributes: { foo: 'bar' } },
      ),
    ];

    const options = {};

    const transformedNetwork = transformSessions(protocol, sessions, resolutions, options);

    // Nodes exist in network prior to resolution
    expect(sessions[0]).networkIncludesNodes(resolutions[0].transforms[0].nodes);

    // Nodes are removed from the transformed network
    expect(transformedNetwork).networkExcludesNodes(resolutions[0].transforms[0].nodes);

    // Transformed node has been added to the transformed network
    expect(transformedNetwork)
      .networkHasNode(resolutions[0].transforms[0].id, resolutions[0].transforms[0].attributes);
  });

  it('leaves sessions later than resolutions unresolved', () => {
    // Set up a single session and a matching resolution with matching nodes, but a date
    // before that session
    const sessions = Factory.session.buildList(1, null, { size: 3 });
    const resolutions = [
      Factory.resolution.build(
        { date: DateTime.local().minus({ days: 10 }).toJSDate() },
        { network: sessions[0], attributes: { foo: 'bar' } },
      ),
    ];

    const options = {
      egoCastType: 'person',
    };

    const transformedNetwork = transformSessions(protocol, sessions, resolutions, options);

    // console.log(
    const transformedIds = transformedNetwork.nodes.map(({ _uid }) => _uid);
    const originalIds = [
      ...sessions[0].nodes.map(({ _uid }) => _uid),
      sessions[0].ego._uid,
    ];

    expect(transformedIds).toEqual(originalIds);
  });

  // blends sessions
  it('applies resolutions prior to resolution id', () => {
    const sessions = Factory.session.buildList(1, null, { size: 5 });

    const resolutions = [];

    resolutions.push(
      Factory.resolution.build({
        date: DateTime.fromJSDate(sessions[0].date).plus({ months: 1 }).toJSDate(),
        transforms: [
          Factory.transform.build({ attributes: { foo: 'bar' } }, { network: sessions[0] }),
        ],
      }),
    );

    resolutions.push(
      Factory.resolution.build({
        date: DateTime.fromJSDate(sessions[0].date).plus({ months: 2 }).toJSDate(),
        transforms: [
          Factory.transform.build({ attributes: { foo: 'bazz' } }, { nodes: [resolutions[0].transforms[0].id] }),
        ],
      }),
    );

    const options = {
      useEgoData: true,
    };

    const transformedNetwork = transformSessions(protocol, sessions, resolutions, options);

    // Transformed network does not contain transformed nodes
    expect(transformedNetwork).networkExcludesNodes(resolutions[0].transforms[0].nodes);
    expect(transformedNetwork).networkExcludesNodes(resolutions[1].transforms[0].nodes);

    // most recent resolution should take precedence
    expect(transformedNetwork)
      .networkHasNode(resolutions[1].transforms[0].id, resolutions[1].transforms[0].attributes);
  });
});
