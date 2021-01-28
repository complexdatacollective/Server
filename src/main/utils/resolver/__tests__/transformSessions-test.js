/* eslint-env jest */
/* eslint-disable no-underscore-dangle */
const { DateTime } = require('luxon');
const {
  intersection,
  difference,
  isEqual,
  map,
} = require('lodash');
const { Factory } = require('../../../../__factories__/Factory');
const {
  nodePrimaryKeyProperty,
  nodeAttributesProperty,
} = require('../../formatters/network');
const {
  getPriorResolutions,
  getSessionsByResolution,
  applyTransform,
  transformSessions,
} = require('../transformSessions');


expect.extend({
  networkIncludesNodes(network, nodeIds) {
    const networkNodeIds = network.nodes.map(node => node[nodePrimaryKeyProperty]);

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
    const networkNodeIds = network.nodes.map(node => node[nodePrimaryKeyProperty]);

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
    const node = network.nodes.find(n => n[nodePrimaryKeyProperty] === id);

    if (!node) {
      return {
        pass: false,
        message: () => `Node ${id} not found`,
      };
    }

    const equal = isEqual(node[nodeAttributesProperty], attributes);

    if (equal) {
      return { pass: true };
    }

    return {
      pass: false,
      message: () => `Node with id ${id} found but attributes differ:

got:
${JSON.stringify(node[nodeAttributesProperty], null, 2)}

expected:
${JSON.stringify(attributes, null, 2)}`,
    };
  },
});

describe('getSessionsByResolution', () => {
  const resolutions = Object.freeze([
    { _id: 'foo', transforms: [], nodes: [], _date: DateTime.fromISO('2019-05-30').toJSDate() },
    { _id: 'bar', transforms: [], nodes: [], _date: DateTime.fromISO('2019-06-30').toJSDate() },
    { _id: 'bazz', transforms: [], nodes: [], _date: DateTime.fromISO('2019-07-30').toJSDate() },
    { _id: 'buzz', transforms: [], nodes: [], _date: DateTime.fromISO('2019-08-30').toJSDate() },
  ]);

  const sessions = Object.freeze([
    { nodes: [], edges: [], _date: DateTime.fromISO('2019-05-25').toJSDate() },
    { nodes: [], edges: [], _date: DateTime.fromISO('2019-05-26').toJSDate() },
    { nodes: [], edges: [], _date: DateTime.fromISO('2019-06-25').toJSDate() },
    { nodes: [], edges: [], _date: DateTime.fromISO('2019-06-26').toJSDate() },
    { nodes: [], edges: [], _date: DateTime.fromISO('2019-06-27').toJSDate() },
    { nodes: [], edges: [], _date: DateTime.fromISO('2019-09-25').toJSDate() },
    { nodes: [], edges: [], _date: DateTime.fromISO('2019-09-26').toJSDate() },
  ]);

  it('groups session by resolution id', () => {
    const expectedResult = {
      foo: [
        { nodes: [], edges: [], _date: DateTime.fromISO('2019-05-25').toJSDate() },
        { nodes: [], edges: [], _date: DateTime.fromISO('2019-05-26').toJSDate() },
      ],
      bar: [
        { nodes: [], edges: [], _date: DateTime.fromISO('2019-06-25').toJSDate() },
        { nodes: [], edges: [], _date: DateTime.fromISO('2019-06-26').toJSDate() },
        { nodes: [], edges: [], _date: DateTime.fromISO('2019-06-27').toJSDate() },
      ],
      _unresolved: [
        { nodes: [], edges: [], _date: DateTime.fromISO('2019-09-25').toJSDate() },
        { nodes: [], edges: [], _date: DateTime.fromISO('2019-09-26').toJSDate() },
      ],
    };

    expect(getSessionsByResolution(resolutions, sessions))
      .toEqual(expectedResult);
  });
});

describe('applyTransform', () => {
  const network = Object.freeze(Factory.network.build(20));

  const transform = Factory.transform.build({ attributes: { foo: 'bar' } }, { network });

  it("each node should be replaced with it's transform", () => {
    const newNetwork = applyTransform(network, transform); // resultant network

    // Nodes exist in network prior to resolution
    expect(network).networkIncludesNodes(transform.nodes);

    // Nodes are removed from the transformed network
    expect(newNetwork).networkExcludesNodes(transform.nodes);

    // Tranformed node has been added to the transformed network
    expect(newNetwork)
      .networkHasNode(transform.id, transform.attributes);
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
  it('applies a resolution to a session', () => {
    // Set up a single session with a resolution with a single transform
    const sessions = [Factory.session.build(null, { size: 5 })];
    const resolutions = [
      Factory.resolution.build(
        { _date: DateTime.fromJSDate(sessions[0]._date).plus({ days: 1 }).toJSDate() },
        { network: sessions[0], transformCount: 1, attributes: { foo: 'bar' } },
      ),
    ];

    const protocol = {};

    const options = {
      fromResolution: resolutions[0]._id,
      useEgoData: true,
    };

    const transformedNetwork = transformSessions(protocol, sessions, resolutions, options);

    // Nodes exist in network prior to resolution
    expect(sessions[0]).networkIncludesNodes(resolutions[0].transforms[0].nodes);

    // Nodes are removed from the transformed network
    expect(transformedNetwork).networkExcludesNodes(resolutions[0].transforms[0].nodes);

    // ...but not all of thhem
    expect(transformedNetwork.nodes.length).toBe(4);

    // Tranformed node has been added to the transformed network
    expect(transformedNetwork)
      .networkHasNode(resolutions[0].transforms[0].id, resolutions[0].transforms[0].attributes);
  });

  it('leaves sessions later than resolutions unresolved', () => {
    // Set up a single session and a matching resolution with matching nodes, but a date
    // before that session
    const sessions = Factory.session.buildList(1, null, { size: 3 });
    const resolutions = [
      Factory.resolution.build(
        { _date: DateTime.local().minus({ days: 10 }).toJSDate() },
        { network: sessions[0], attributes: { foo: 'bar' } },
      ),
    ];

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

    const options = {
      fromResolution: resolutions[0]._id,
      egoCastType: 'bar',
      useEgoData: true,
    };

    const transformedNetwork = transformSessions(protocol, sessions, resolutions, options);

    expect(transformedNetwork.nodes).toEqual([
      ...sessions[0].nodes,
      { ...sessions[0].ego, type: 'bar' }, // Ego is still appended
    ]);
  });

  // blends sessions
  it('applies resolutions prior to resolution id', () => {
    const sessions = Factory.session.buildList(1, null, { size: 5 });

    const resolutions = [];

    const protocol = {};

    resolutions.push(
      Factory.resolution.build({
        _date: DateTime.fromJSDate(sessions[0]._date).plus({ months: 1 }).toJSDate(),
        transforms: [
          Factory.transform.build({ attributes: { foo: 'bar' } }, { network: sessions[0] }),
        ],
      }),
    );

    resolutions.push(
      Factory.resolution.build({
        _date: DateTime.fromJSDate(sessions[0]._date).plus({ months: 2 }).toJSDate(),
        transforms: [
          Factory.transform.build({ attributes: { foo: 'bazz' } }, { nodes: [resolutions[0].transforms[0].id] }),
        ],
      }),
    );

    resolutions.push(
      Factory.resolution.build({
        _date: DateTime.fromJSDate(sessions[0]._date).plus({ months: 3 }).toJSDate(),
        transforms: [
          Factory.transform.build({ attributes: { foo: 'buzz' } }, { nodes: [resolutions[1].transforms[0].id] }),
        ],
      }),
    );

    const options = {
      fromResolution: resolutions[1]._id,
      useEgoData: true,
    };

    const transformedNetwork = transformSessions(protocol, sessions, resolutions, options);

    // Transformed network does not contain transformed nodes
    expect(transformedNetwork).networkExcludesNodes(resolutions[0].transforms[0].nodes);
    expect(transformedNetwork).networkExcludesNodes(resolutions[1].transforms[0].nodes);

    // most recent resolution should take precidence
    expect(transformedNetwork)
      .networkHasNode(resolutions[1].transforms[0].id, resolutions[1].transforms[0].attributes);
  });
});
