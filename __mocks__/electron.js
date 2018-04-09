/* eslint-env jest */

// const electron = jest.genMockFromModule('electron');

const ipcRenderer = {
  on: jest.fn(),
  once: jest.fn(),
  send: jest.fn(),
};

const ipcMain = {
  on: jest.fn(),
};

const app = {
  getName: () => 'test',
};

const dialog = {
  showOpenDialog: jest.fn(),
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

BrowserWindow.getAllWindows = jest.fn().mockReturnValue([]);

module.exports = {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  ipcRenderer,
};

exports.BrowserWindow = BrowserWindow;
