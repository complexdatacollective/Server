/* eslint-env jest */

const ipcRenderer = {
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  send: jest.fn(),
};

const ipcMain = {
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
};

const app = {
  commandLine: {
    hasSwitch: jest.fn(),
    getSwitchValue: jest.fn(() => 'aaaaaaaaaaaaaaaa'),
  },
  dock: {
    hide: jest.fn(),
    show: jest.fn(),
  },
  getVersion: jest.fn(() => ''),
  getName: jest.fn(() => 'test'),
  getPath: jest.fn(() => '.'),
  requestSingleInstanceLock: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn(),
  quit: jest.fn(),
};

const dialog = {
  showErrorBox: jest.fn(() => Promise.resolve()),
  showMessageBox: jest.fn(() => Promise.resolve()),
  showOpenDialog: jest.fn(() => Promise.resolve({ canceled: false, filePaths: [] })),
  showSaveDialog: jest.fn(() => Promise.resolve({ canceled: false, filePath: undefined })),
};

const remote = {
  app: {
    commandLine: {
      hasSwitch: jest.fn(),
      getSwitchValue: jest.fn(() => 'aaaaaaaaaaaaaaaa'),
    },
    getVersion: jest.fn(() => '1.0.0'),
  },
  dialog,
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
BrowserWindow.getFocusedWindow = BrowserWindow;

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
