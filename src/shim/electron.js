/* eslint-disable no-console */
/* istanbul ignore next */
(function devBrowserShim() {
  const on = (channel, cb) => { console.log(channel, cb); };
  const once = (channel, cb) => {
    if (channel === 'API_INFO') {
      // Hardcode support for initial API setup so app can load in dev browser
      setTimeout(() => {
        cb(new Event({}), { port: 8080 });
      }, 0);
    }
    console.log(channel, cb);
  };
  const send = (message) => { console.log(message); };

  module.exports = {
    remote: {
      app: {
        getVersion: () => 'WEB',
      },
      process: {
        platform: 'WEB',
      },
    },
    ipcRenderer: {
      send,
      on,
      once,
    },
  };
}());
