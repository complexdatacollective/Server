/* eslint-env jest */

// const electron = jest.genMockFromModule('electron');

const ipcRenderer = {
  on: jest.fn(),
  send: jest.fn(),
};

const ipcMain = {
  on: jest.fn(),
};

const app = {
  getName: () => 'test',
};

class BrowserWindow {
  constructor() {
    return {
      loadURL: jest.fn(),
      maximize: jest.fn(),
      show: jest.fn(),
      on: jest.fn(),
      webContents: {
        openDevTools: jest.fn(),
        send: jest.fn(),
      },
    };
  }
}

module.exports = {
  app,
  BrowserWindow,
  ipcMain,
  ipcRenderer,
};

exports.BrowserWindow = BrowserWindow;
