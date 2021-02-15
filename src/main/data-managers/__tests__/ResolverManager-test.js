/* eslint-env jest */

const miss = require('mississippi');
const ResolverManager = require('../ResolverManager');
const { getNetworkResolver } = require('../../utils/getNetworkResolver');
const { transformSessions } = require('../../utils/resolver/transformSessions');

jest.mock('nedb');
jest.mock('electron-log');

jest.mock('../../utils/resolver/transformSessions');

jest.mock('../../utils/getNetworkResolver');

jest.mock('../ProtocolDB', () => (function MockSessionDB() {
  return {
    get: jest.fn().mockResolvedValue({}),
  };
}));

jest.mock('../SessionDB', () => (function MockSessionDB() {
  return {
    findAll: jest.fn().mockResolvedValue([]),
  };
}));

jest.mock('../ResolverDB', () => (function MockResolverDB() {
  return {
    findAll: jest.fn().mockResolvedValue([]),
    getResolutions: jest.fn().mockResolvedValue([]),
  };
}));

describe('ResolverManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ResolverManager('.');
  });

  it('getResolutionsWithSessionCounts() returns resolutions with session counts', async () => {
    const anchorDate = Date.now();
    // This must be descending order
    const resolutions = [
      {
        _id: 2,
        createdAt: anchorDate + 100,
        transforms: [undefined, undefined],
        options: {},
      },
      {
        _id: 1,
        createdAt: anchorDate,
        transforms: [undefined, undefined, undefined],
        options: {},
      },
    ];

    manager.db.getResolutions.mockResolvedValueOnce(resolutions);

    const sessions = [
      // resolved
      { createdAt: anchorDate - 110 }, // 1
      { createdAt: anchorDate - 110 }, // 1
      { createdAt: anchorDate - 110 }, // 1
      { createdAt: anchorDate + 10 }, // 2
      // un resolved
      { createdAt: anchorDate + 110 },
      { createdAt: anchorDate + 110 },
    ];

    manager.sessionDb.findAll.mockResolvedValueOnce(sessions);

    await expect(manager.getResolutionsWithSessionCounts(null, null))
      .resolves.toMatchObject({
        resolutions: [
          {
            id: 2,
            date: anchorDate + 100,
            transforms: [undefined, undefined],
            sessionCount: 1,
          },
          {
            id: 1,
            date: anchorDate,
            transforms: [undefined, undefined, undefined],
            sessionCount: 3,
          },
        ],
        unresolved: 2,
      });
  });

  describe('getResolvedSessions()', () => {
    it('returns a resolver promise', async () => {
      // const protocolId = '1234';

      // const options = {
      //   egoCastType: 'person',
      //   resolutionId: '5678',
      //   resolver: {
      //     interpreterPath: '',
      //     resolverPath: '',
      //     args: '',
      //   },
      // };

      // const sessions = await manager.getResolvedSessions(
      //   protocolId,
      //   options,
      // );

      // // TODO: update transformSessions to take resolutions and no resolutionId
      // // so that this works as expected
      // // getResolutions should be able to specify the last resolution to select
      // // expect(sessions).toMatchObject({ nodes: [], edges: [] });

      // expect(transformSessions.mock.calls[0]).toEqual([
      //   {},
      //   [],
      //   [],
      //   { egoCastType: 'person', includeUnresolved: true, resolutionId: '5678' },
      // ]);
    });
  });

  describe('resolveProtocol()', () => {
    it('resolves to a stream', (done) => {
      const protocolId = '1234';
      const requestId = '5678';
      const options = {
        interpreterPath: '',
        resolverPath: '',
        args: '',
        egoCastType: 'person',
      };

      const mockStream = () => miss.through(
        (chunk, enc, cb) => {
          cb(null, chunk.toString());
        },
      );

      transformSessions.mockResolvedValueOnce({
        nodes: [],
        edges: [],

      });
      manager.sessionDb.findAll.mockResolvedValueOnce([{
        createdAt: '',
        data: {
          sessionVariables: {
            protocolName: '',
            codebookHash: '',
          },
        },
      }]);
      manager.protocolDb.get.mockResolvedValueOnce({ codebook: {} });
      getNetworkResolver.mockImplementationOnce(
        () => Promise.resolve(mockStream()),
      );

      manager.resolveProtocol(
        protocolId,
        requestId,
        options,
      )
        .then((resolver) => {
          resolver.on('finish', () => done());
          resolver.write('hi');
          resolver.end();
        });
    });
  });
});
