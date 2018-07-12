/* eslint-env jest */
require('../index');
const { autoUpdater } = require('electron-updater');
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

  it('checks for updates on start', () => {
    expect(autoUpdater.checkForUpdatesAndNotify).toHaveBeenCalled();
  });

  it('sets an update logger', () => {
    expect(autoUpdater.logger).toBeDefined();
  });
});
