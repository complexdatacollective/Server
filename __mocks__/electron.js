/* eslint-env jest */

// const electron = jest.genMockFromModule('electron');

const ipcRenderer = {
  on: jest.fn(),
  send: jest.fn(),
};

exports.ipcRenderer = ipcRenderer;
