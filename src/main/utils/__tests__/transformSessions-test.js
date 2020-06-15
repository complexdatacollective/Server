/* eslint-env jest */
const { DateTime } = require('luxon');
const {
  intersection,
  difference,
  isEqual,
} = require('lodash');
const { Factory } = require('../../../__factories__/Factory');
const {
  nodePrimaryKeyProperty,
  nodeAttributesProperty,
} = require('../../utils/formatters/network');
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

const mapIds = ({ _meta: { id } }) => id;

describe('getPriorResolutions', () => {
  const resolutions = Object.freeze([
    { _meta: { id: 'foo', date: DateTime.local().toJSDate() } },
    { _meta: { id: 'bar', date: DateTime.local().minus({ hours: 1 }).toJSDate() } },
    { _meta: { id: 'bazz', date: DateTime.local().plus({ hours: 5 }).toJSDate() } },
    { _meta: { id: 'buzz', date: DateTime.local().minus({ hours: 5 }).toJSDate() } },
  ]);

  it('sorts resolutions by date (oldest to newest)', () => {
    const prior = getPriorResolutions(resolutions, null)
      .map(mapIds);

    expect(prior)
      .toEqual([
        'buzz',
        'bar',
        'foo',
        'bazz',
      ]);
  });

  it('returns resolutions if no resolutionsId', () => {
    expect(getPriorResolutions(resolutions, null))
      .toHaveLength(4);
  });

  it('throws if resolution id is missing', () => {
    expect(() => {
      getPriorResolutions(resolutions, 'fizz');
    }).toThrow('Resolution "fizz" could not be found');
  });

  it('returns resolutions before and including resolution id', () => {
    const prior = getPriorResolutions(resolutions, 'bar')
      .map(mapIds);

    expect(prior)
      .toEqual([
        'buzz',
        'bar',
      ]);
  });
});

describe('getSessionsByResolution', () => {
  const resolutions = Object.freeze([
    { _meta: { id: 'foo', transforms: [], nodes: [], date: DateTime.fromISO('2019-05-30').toJSDate() } },
    { _meta: { id: 'bar', transforms: [], nodes: [], date: DateTime.fromISO('2019-06-30').toJSDate() } },
    { _meta: { id: 'bazz', transforms: [], nodes: [], date: DateTime.fromISO('2019-07-30').toJSDate() } },
    { _meta: { id: 'buzz', transforms: [], nodes: [], date: DateTime.fromISO('2019-08-30').toJSDate() } },
  ]);

  const sessions = Object.freeze([
    { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-05-25').toJSDate() } },
    { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-05-26').toJSDate() } },
    { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-06-25').toJSDate() } },
    { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-06-26').toJSDate() } },
    { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-06-27').toJSDate() } },
    { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-09-25').toJSDate() } },
    { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-09-26').toJSDate() } },
  ]);

  it('groups session by resolution id', () => {
    const expectedResult = {
      foo: [
        { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-05-25').toJSDate() } },
        { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-05-26').toJSDate() } },
      ],
      bar: [
        { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-06-25').toJSDate() } },
        { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-06-26').toJSDate() } },
        { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-06-27').toJSDate() } },
      ],
      _unresolved: [
        { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-09-25').toJSDate() } },
        { nodes: [], edges: [], _meta: { date: DateTime.fromISO('2019-09-26').toJSDate() } },
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
        { _meta: { date: DateTime.fromISO(sessions[0].date).plus({ days: 1 }).toJSDate() } },
        { network: sessions[0], transformCount: 1, attributes: { foo: 'bar' } },
      ),
    ];
    const options = {
      fromResolution: resolutions[0].id,
      useEgoData: true,
    };

    const transformedNetwork = transformSessions(sessions, resolutions, options);

    // Nodes exist in network prior to resolution
    expect(sessions[0]).networkIncludesNodes(resolutions[0].transforms[0].nodes);

    // Nodes are removed from the transformed network
    expect(transformedNetwork).networkExcludesNodes(resolutions[0].transforms[0].nodes);

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
        { _meta: { date: DateTime.local().minus({ days: 10 }).toJSDate() } },
        { network: sessions[0], attributes: { foo: 'bar' } },
      ),
    ];

    const options = {
      fromResolution: resolutions[0].id,
      useEgoData: true,
    };

    const transformedNetwork = transformSessions(sessions, resolutions, options);

    expect(transformedNetwork.nodes).toEqual(sessions[0].nodes);
  });

  // blends sessions
  it('applies resolutions prior to resolution id', () => {
    // Set up a single session and a matching resolution with matching nodes, but a date
    // before that session
    const sessions = Factory.session.buildList(1, null, { size: 5 });

    const resolutions = [];

    resolutions.push(
      Factory.resolution.build({
        _meta: { date: DateTime.fromISO(sessions[0].date).plus({ minutes: 1 }).toJSDate() },
        transforms: [Factory.transform.build({ attributes: { foo: 'bar' } }, { network: sessions[0] })],
      }),
    );

    resolutions.push(
      Factory.resolution.build({
        date: DateTime.fromISO(sessions[0].date).plus({ minutes: 2 }).toISO(),
        transforms: [
          Factory.transform.build({ attributes: { foo: 'bazz' } }, { nodes: [resolutions[0].transforms[0].id] }),
        ],
      }),
    );

    resolutions.push(
      Factory.resolution.build({
        date: DateTime.fromISO(sessions[0].date).plus({ minutes: 2 }).toISO(),
        transforms: [
          Factory.transform.build({ attributes: { foo: 'buzz' } }, { nodes: [resolutions[1].transforms[0].id] }),
        ],
      }),
    );

    const options = {
      fromResolution: resolutions[1].id,
      useEgoData: true,
    };

    const transformedNetwork = transformSessions(sessions, resolutions, options);

    // Transformed network does not contain transformed nodes
    expect(transformedNetwork).networkExcludesNodes(resolutions[0].transforms[0].nodes);
    expect(transformedNetwork).networkExcludesNodes(resolutions[1].transforms[0].nodes);

    // most recent resolution should take precidence
    expect(transformedNetwork)
      .networkHasNode(resolutions[1].transforms[0].id, resolutions[1].transforms[0].attributes);
  });
});
