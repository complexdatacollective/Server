/* eslint-env jest, jasmine */

const path = require('path');
const { createServer } = require('../ServerFactory');

jest.mock('../ensurePemKeyPair');

const mockServerMethods = {
  close: jest.fn(),
  startServices: jest.fn(() => Promise.resolve(mockServerMethods)), // startServices returns `this`
};

jest.mock('private-socket', () => ({
  generatePemKeyPair: jest.fn().mockResolvedValue({}),
}));

jest.mock('../Server', () => function MockServer() {
  return mockServerMethods;
});

const testPort = 9001; // Auto find port
const testDataDir = path.join('.');

describe('serverManager', () => {
  describe('createServer', () => {
    it('creates a server', async () => {
      await createServer(testPort, testDataDir).then((server) => {
        expect(server).toBeDefined();
      });
    });

    it('starts services', async () => {
      await createServer(testPort, testDataDir).then((server) => {
        expect(server.startServices).toHaveBeenCalled();
      });
    });

    it('requires a data directory', async () => {
      await expect(createServer(testPort)).rejects
        .toMatchErrorMessage('You must specify a user data directory');
    });

    it('requires a port', async () => {
      await expect(createServer(null, './tmp')).rejects
        .toMatchErrorMessage('You must specify a server port');
    });
  });
});
