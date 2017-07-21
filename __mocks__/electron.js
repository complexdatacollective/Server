/* eslint-env jest */

// const electron = jest.genMockFromModule('electron');

const remote = {
  getGlobal: jest.fn(),
};

const ipcRenderer = {
  on: jest.fn(),
};

exports.remote = remote;
exports.ipcRenderer = ipcRenderer;
