/* eslint-env jest */

// const electron = jest.genMockFromModule('electron');

const ipcRenderer = {
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  send: jest.fn(),
};

const ipcMain = {
  on: jest.fn(),
  once: jest.fn(),
};

const app = {
  dock: {
    hide: jest.fn(),
    show: jest.fn(),
  },
  getVersion: jest.fn(() => ''),
  getName: jest.fn(() => 'test'),
  getPath: jest.fn(() => '.'),
  makeSingleInstance: jest.fn(),
  on: jest.fn(),
  quit: jest.fn(),
};

const dialog = {
  showMessageBox: jest.fn(),
  showOpenDialog: jest.fn(),
};

const remote = {
  app,
  process: {
    platform: '',
  },
};

const Tray = jest.fn(() => ({
  on: jest.fn(),
  setContextMenu: jest.fn(),
  setToolTip: jest.fn(),
}));

const Menu = {
  buildFromTemplate: jest.fn(),
  setApplicationMenu: jest.fn(),
};

const BrowserWindow = jest.fn(() => ({
  loadURL: jest.fn(),
  maximize: jest.fn(),
  show: jest.fn(),
  on: jest.fn(),
  webContents: {
    getURL: jest.fn(),
    on: jest.fn(),
    openDevTools: jest.fn(),
    send: jest.fn(),
  },
}));

BrowserWindow.getAllWindows = jest.fn().mockReturnValue([]);

module.exports = {
  app,
  BrowserWindow,
  Menu,
  Tray,
  dialog,
  ipcMain,
  ipcRenderer,
  remote,
};

exports.BrowserWindow = BrowserWindow;
