const { fork } = require('child_process');
const PrivateSocket = require('private-socket');
const Datastore = require('nedb');
const Server = require('./Server');
const settings = require('./settings');

const SERVER_READY = 'SERVER_READY';
const STOP_SERVER = 'STOP_SERVER';
const SERVER_STATUS = 'SERVER_STATUS';

const db = new Datastore({ filename: 'db/app', autoload: true });
const appSettings = settings(db);

const ensurePemKeyPair = (currentAppSettings) => {
  if (!currentAppSettings || !currentAppSettings.keys) {
    return PrivateSocket.generatePemKeyPair()
      .then(
        keypair =>
          Object.assign({}, currentAppSettings, { keys: keypair })
      );
  }

  return currentAppSettings;
};

const startServer = port =>
  appSettings
    .get()
    .then(ensurePemKeyPair)
    .then(appSettings.set)
    .then(currentAppSettings => new Server(port, currentAppSettings));

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
