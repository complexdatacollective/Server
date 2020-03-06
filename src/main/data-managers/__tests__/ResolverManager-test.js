/* eslint-env jest */
const {
  intersection,
} = require('lodash');
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

describe('getPriorResolutions', () => {
  const resolutions = Object.freeze([
    { id: 'foo', transforms: [], nodes: [] },
    { id: 'bar', transforms: [], nodes: [] },
    { id: 'bazz', transforms: [], nodes: [] },
    { id: 'buzz', transforms: [], nodes: [] },
  ]);

  it('returns resolutions if no resolutionsId', () => {
    expect(getPriorResolutions(resolutions, null))
      .toBe(resolutions);
  });

  it('throws if resolution id is missing', () => {
    expect(() => {
      getPriorResolutions(resolutions, 'fizz');
    }).toThrow('Resolution "fizz" could not be found');
  });

  it('returns resolutions before and including resolution id', () => {
    expect(getPriorResolutions(resolutions, 'bar'))
      .toEqual(resolutions.slice(0, 2));
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
    const { nodes } = applyTransform(network, transform); // resultant network
    const networkNodeIds = network.nodes.map(node => node[nodePrimaryKeyProperty]);
    const transformedNetworkNodeIds = nodes.map(node => node[nodePrimaryKeyProperty]);

    // nodes were in original network
    expect(intersection(networkNodeIds, transform.nodes).length).toBe(transform.nodes.length);
    // nodes were removed from network
    expect(intersection(transformedNetworkNodeIds, transform.nodes).length).toBe(0);
    // transformed node was added to network
    expect(nodes.find(node => node[nodePrimaryKeyProperty] === transform.id))
      .toEqual({
        [nodePrimaryKeyProperty]: transform.id,
        [nodeAttributesProperty]: transform.attributes,
      });
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
  // const transformSessions = (sessions, resolutions, { resolution, useEgoData }) => {
  it('applies resolutions to sessions before selected snapshot', () => {
    const sessions = Factory.session.buildList(3);
    const resolutions = [
      Factory.resolution.build(
        { date: sessions[1].date },
        { network: sessions[1], attributes: { foo: 'bar' } },
      ),
    ];
    // console.log(sessions, resolutions);
    const options = {
      fromResolution: resolutions[0].id,
      useEgoData: true,
    };

    const transformed = transformSessions(sessions, resolutions, options);

    console.log(JSON.stringify(transformed.ego));
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
