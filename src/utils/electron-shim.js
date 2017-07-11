/* eslint-disable no-console */

const ipcRenderer = {
  send: (message) => { console.log(message); },
};

module.exports = {
  ipcRenderer,
};
