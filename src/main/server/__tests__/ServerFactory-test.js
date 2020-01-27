/* eslint-env jest, jasmine */

const path = require('path');
const { createServer } = require('../ServerFactory');

jest.mock('../certificateManager');

const mockServerMethods = {
  close: jest.fn(),
  startServices: jest.fn(() => Promise.resolve(mockServerMethods)), // startServices returns `this`
};

jest.mock('../Server', () => function MockServer() {
  return mockServerMethods;
});

const testHttpPort = 9001;
const testHttpsPort = 9002;
const testDataDir = path.join('.');

describe('serverManager', () => {
  describe('createServer', () => {
    it('creates a server', async () => {
      await createServer(testDataDir, testHttpPort, testHttpsPort).then((server) => {
        expect(server).toBeDefined();
      });
    });

    it('starts services', async () => {
      await createServer(testDataDir, testHttpPort, testHttpsPort).then((server) => {
        expect(server.startServices).toHaveBeenCalled();
      });
    });

    it('requires a data directory', async () => {
      await expect(createServer(null)).rejects
        .toMatchErrorMessage('You must specify a user data directory');
    });

    it('does not require a port', async () => {
      await expect(createServer('./tmp')).resolves
        .toMatchObject({ close: expect.any(Function) });
    });
  });
});
