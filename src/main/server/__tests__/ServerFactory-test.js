/* eslint-env jest, jasmine */

const path = require('path');
const { createServer } = require('../ServerFactory');

const mockServerMethods = {
  close: jest.fn(),
  startServices: jest.fn(() => Promise.resolve(mockServerMethods)), // startServices returns `this`
};

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
      const mockError = { message: 'You must specify a user data directory' };
      await expect(createServer(testPort)).rejects.toMatchObject(mockError);
    });
  });
});
