/* eslint-disable no-console */
/* istanbul ignore next */
(function devBrowserShim() {
  const on = (channel, cb) => { console.log(channel, cb); };
  const once = (channel, cb) => { console.log(channel, cb); };
  const send = (message) => { console.log(message); };

  module.exports = {
    ipcRenderer: {
      send,
      on,
      once,
    },
  };
}());
