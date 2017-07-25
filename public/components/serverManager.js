const { fork } = require('child_process');
const PrivateSocket = require('private-socket');
const Server = require('./Server');
const { set: saveSettings, get: getSettings } = require('./settings');

const SERVER_READY = 'SERVER_READY';
const STOP_SERVER = 'STOP_SERVER';

const ensurePemKeyPair = (settings) => {
  if (!settings || !settings.keys) {
    return PrivateSocket.generatePemKeyPair()
      .then(
        keypair =>
          Object.assign({}, settings, { keys: keypair })
      );
  }

  return settings;
};

const startServer = port =>
  getSettings()
    .then(ensurePemKeyPair)
    .then(saveSettings)
    .then(settings => new Server(port, settings));

const serverTaskHandler = ({ action }) => {
  switch (action) {
    case STOP_SERVER:
      return process.exit();
    default:
      return false;
  }
};

class ServerProcess {
  constructor({ ps }) {
    this.process = ps;
  }

  stop() {
    this.process.send({ action: STOP_SERVER });
  }
}

const createServer = port =>
  new Promise((resolve) => {
    const ps = fork(`${__filename}`, [], { env: { PORT: port } });
    ps.on('message', ({ action }) => {
      if (action === SERVER_READY) {
        resolve(new ServerProcess({
          ps,
        }));
      }
    });
  });

module.exports = {
  createServer,
};

if (require.main === module) {
  process.on('message', serverTaskHandler);
  startServer(process.env.PORT).then(() => {
    process.send({ action: SERVER_READY });
  });
}
