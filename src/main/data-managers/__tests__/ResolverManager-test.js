/* eslint-env jest */

import ResolverManager from '../ResolverManager';
import { ErrorMessages } from '../../errors/RequestError';

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
