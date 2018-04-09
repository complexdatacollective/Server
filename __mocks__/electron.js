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
  on: jest.fn(),
  getName: jest.fn(() => 'test'),
  getPath: jest.fn(() => '.'),
};

const dialog = {
  showOpenDialog: jest.fn(),
};

const Menu = {
  buildFromTemplate: jest.fn(),
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
  Menu,
  dialog,
  ipcMain,
  ipcRenderer,
};

exports.BrowserWindow = BrowserWindow;
