/* eslint-env jest */
require('../index');
const { createApp } = require('../MainApp');

jest.mock('electron');

jest.mock('../MainApp', () => ({
  createApp: jest.fn().mockReturnValue({
    app: {
      on: jest.fn(),
    },
    mainWindow: {
      send: jest.fn(),
    },
  }),
}));

jest.mock('../server/ServerFactory', () => ({
  serverEvents: {},
  createServer: jest.fn().mockResolvedValue({
    connectionInfo: {
      adminService: { port: 12345 },
    },
    on: jest.fn(),
  }),
}));

describe('index', () => {
  it('creates the app', () => {
    expect(createApp).toHaveBeenCalled();
  });
});
