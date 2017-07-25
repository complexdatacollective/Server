/* eslint-disable no-console */

const ipcRenderer = {
  send: (message) => { console.log(message); },
  on: (channel, cb) => { console.log(channel, cb); },
};

module.exports = {
  ipcRenderer,
};
