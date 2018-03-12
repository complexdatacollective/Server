/* eslint-env jest */

// const electron = jest.genMockFromModule('electron');

const ipcRenderer = {
  on: jest.fn(),
  send: jest.fn(),
};

const ipcMain = {
  on: jest.fn(),
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
  ipcMain,
  ipcRenderer,
  BrowserWindow,
};

exports.BrowserWindow = BrowserWindow;
