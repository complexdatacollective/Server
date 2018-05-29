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
  getName: jest.fn(() => 'test'),
  getPath: jest.fn(() => '.'),
  on: jest.fn(),
  quit: jest.fn(),
};

const dialog = {
  showOpenDialog: jest.fn(),
};


const Tray = jest.fn().mockImplementation(() => ({
  setContextMenu: jest.fn(),
  setToolTip: jest.fn(),
}));

const Menu = {
  buildFromTemplate: jest.fn(),
  setApplicationMenu: jest.fn(),
};

class BrowserWindow {
  constructor() {
    return {
      loadURL: jest.fn(),
      maximize: jest.fn(),
      show: jest.fn(),
      on: jest.fn(),
      webContents: {
        getURL: jest.fn(),
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
  Tray,
  dialog,
  ipcMain,
  ipcRenderer,
};

exports.BrowserWindow = BrowserWindow;
