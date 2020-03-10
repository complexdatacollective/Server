/* eslint-env jest */
const {
  ResolverManager,
} = require('../ResolverManager');
const { ErrorMessages } = require('../../errors/RequestError');

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

jest.mock('../../utils/commandRunner');

describe('resolveProtocol()', () => {
  const protocol = { id: '1', name: '1', createdAt: new Date() };
  const validOpts = {
    command: 'reverse_string',
  };
  let manager;

  beforeEach(() => {
    manager = new ResolverManager('.');
  });

  it('rejects if protocol missing', async () => {
    await expect(manager.resolveProtocol(null, validOpts))
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
      await expect(manager.resolveProtocol(protocol, validOpts)).resolves.toAlwaysPass();
    });

    // it.only('can abort the process', () => {
    //   const abortable = manager.resolveProtocol(protocol, validOpts);
    //   expect(abortable.abort).toBeInstanceOf(Function);
    //   abortable.abort();
    // });

    it.only('promise resolves to the stdout of script (commandRunner)', async () => {
      await expect(manager.resolveProtocol(protocol, validOpts))
        .resolves.toEqual('dlrow olleh');
    });
  });
});
