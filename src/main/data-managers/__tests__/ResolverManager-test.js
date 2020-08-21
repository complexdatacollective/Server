/* eslint-env jest */
const {
  ResolverManager,
} = require('../ResolverManager');
const ProtocolManager = require('../ProtocolManager');
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
    getResolutions: jest.fn().mockResolvedValue([]),
  };
}));

jest.mock('../../utils/commandRunner');

const protocolManager = new ProtocolManager('.');

describe('resolveProtocol()', () => {
  const validOpts = {
    command: '/dev/null',
    codebook: {},
  };

  let manager;

  beforeEach(() => {
    manager = new ResolverManager(protocolManager);
  });

  it('rejects if protocol missing', async () => {
    await expect(manager.resolveProtocol(null, null, validOpts))
      .rejects.toMatchErrorMessage(ErrorMessages.NotFound);
  });
});
