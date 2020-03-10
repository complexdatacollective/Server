/* eslint-env jest */
const {
  intersection,
  difference,
  isEqual,
} = require('lodash');
const { DateTime } = require('luxon');
const {
  ResolverManager,
  getPriorResolutions,
  getSessionsByResolution,
  applyTransform,
  transformSessions,
} = require('../ResolverManager');
const { nodePrimaryKeyProperty, nodeAttributesProperty } = require('../../utils/formatters/network');
const { ErrorMessages } = require('../../errors/RequestError');
const { Factory } = require('../../../__factories__/Factory');
// import mockProtocol from '../../../../__mocks__/protocol.json';

const debug = (attrs, name = '') => console.log(name, JSON.stringify(attrs, null, 2));

jest.mock('nedb');
jest.mock('electron-log');

jest.mock('../SessionDB', () => (function MockSessionDB() {
  return {
    findAll: jest.fn().mockResolvedValue([]),
  };
}));

jest.mock('../ResolverDB', () => (function MockResolverDB() {
  return {
    findAll: jest.fn().mockResolvedValue([]),
  };
}));

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


describe('getPriorResolutions', () => {
  const resolutions = Object.freeze([
    { id: 'foo', transforms: [], nodes: [], date: DateTime.local() },
    { id: 'bar', transforms: [], nodes: [], date: DateTime.local().minus({ hours: 1 }) },
    { id: 'bazz', transforms: [], nodes: [], date: DateTime.local().plus({ hours: 5 }) },
    { id: 'buzz', transforms: [], nodes: [], date: DateTime.local().minus({ hours: 5 }) },
  ]);

  it('sorts resolutions by date (oldest to newest)', () => {
    expect(getPriorResolutions(resolutions, null))
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'buzz' }),
          expect.objectContaining({ id: 'bar' }),
          expect.objectContaining({ id: 'foo' }),
          expect.objectContaining({ id: 'bazz' }),
        ]),
      );
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
    expect(getPriorResolutions(resolutions, 'bar'))
      .toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'buzz' }),
          expect.objectContaining({ id: 'bar' }),
        ]),
      );
  });
});

describe('getSessionsByResolution', () => {
  const resolutions = Object.freeze([
    { id: 'foo', transforms: [], nodes: [], date: '2019-05-30' },
    { id: 'bar', transforms: [], nodes: [], date: '2019-06-30' },
    { id: 'bazz', transforms: [], nodes: [], date: '2019-07-30' },
    { id: 'buzz', transforms: [], nodes: [], date: '2019-08-30' },
  ]);

  const sessions = Object.freeze([
    { nodes: [], edges: [], date: '2019-05-25' },
    { nodes: [], edges: [], date: '2019-05-26' },
    { nodes: [], edges: [], date: '2019-06-25' },
    { nodes: [], edges: [], date: '2019-06-26' },
    { nodes: [], edges: [], date: '2019-06-27' },
    { nodes: [], edges: [], date: '2019-09-25' },
    { nodes: [], edges: [], date: '2019-09-26' },
  ]);

  it('groups session by resolution id', () => {
    const expectedResult = {
      foo: [
        { nodes: [], edges: [], date: '2019-05-25' },
        { nodes: [], edges: [], date: '2019-05-26' },
      ],
      bar: [
        { nodes: [], edges: [], date: '2019-06-25' },
        { nodes: [], edges: [], date: '2019-06-26' },
        { nodes: [], edges: [], date: '2019-06-27' },
      ],
      _unresolved: [
        { nodes: [], edges: [], date: '2019-09-25' },
        { nodes: [], edges: [], date: '2019-09-26' },
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

describe.only('transformSessions', () => {
  it('applies a resolution to a session', () => {
    // Set up a single session with a resolution with a single transform
    const sessions = [Factory.session.build(null, { size: 5 })];
    const resolutions = [
      Factory.resolution.build(
        { date: DateTime.fromISO(sessions[0].date).plus({ days: 1 }).toISO() },
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
        { date: DateTime.local().minus({ days: 10 }).toISO() },
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
        date: DateTime.fromISO(sessions[0].date).plus({ minutes: 1 }).toISO(),
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

describe('ResolverManager', () => {
  let protocol;
  let validOpts;
  let manager;

  beforeEach(() => {
    manager = new ResolverManager('.');
    protocol = { id: '1', name: '1', createdAt: new Date() };
    validOpts = {
      command: 'reverse_string',
    };
  });

  it('rejects if protocol missing', async () => {
    await expect(manager.resolveNetwork(null, validOpts))
      .rejects.toMatchErrorMessage(ErrorMessages.NotFound);
  });

  describe('with data', () => {
    beforeEach(() => {
      // protocol.codebook = {};
      manager.sessionDB = {
        findAll: jest.fn().mockResolvedValue([{ data: { nodes: [], edges: [] } }]),
      };
    });

    it('returns a promise', async () => {
      await expect(manager.resolveNetwork(protocol, validOpts)).resolves.toAlwaysPass();
    });

    it('can abort the process', () => {
      const abortable = manager.resolveNetwork(protocol, validOpts);
      expect(abortable.abort).toBeInstanceOf(Function);
      abortable.abort();
    });

    it('promise resolves to the stdout of script', async () => {
      await expect(manager.resolveNetwork(protocol, validOpts))
        .resolves.toEqual('dlrow olleh');
    });
  });
});
