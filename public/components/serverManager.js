const { fork } = require('child_process');
const PrivateSocket = require('private-socket');
const Server = require('./Server');
const { set: saveSettings, get: getSettings } = require('./settings');

const SERVER_READY = 'SERVER_READY';
const STOP_SERVER = 'STOP_SERVER';
const SERVER_STATUS = 'SERVER_STATUS';

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

const serverTaskHandler = server =>
  ({ action }) => {
    switch (action) {
      case STOP_SERVER:
        return process.exit();
      case SERVER_STATUS:
        return process.send({
          action: SERVER_STATUS,
          data: server.status(),
        });
      default:
        return false;
    }
  };

class ServerProcess {
  constructor({ ps }) {
    this.process = ps;
  }

  stop() {
    this.send({ action: STOP_SERVER });
  }

  send(data) {
    this.process.send(data);
  }

  onMessage(action, cb) {
    this.process.on('message', (message) => {
      if (message.action === action) {
        cb(message.data);
      }
    });
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
  startServer(process.env.PORT).then((server) => {
    process.on('message', serverTaskHandler(server));
    process.send({ action: SERVER_READY });
  });
}
