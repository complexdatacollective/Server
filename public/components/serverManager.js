const { fork } = require('child_process');
const PrivateSocket = require('private-socket');
const Datastore = require('nedb');
const Server = require('./Server');
const settings = require('./settings');

const SERVER_READY = 'SERVER_READY';
const STOP_SERVER = 'STOP_SERVER';
const SERVER_STATUS = 'SERVER_STATUS';
const REQUEST_SERVER_STATUS = 'REQUEST_SERVER_STATUS';

// Module when run as fork:

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

const startServer = (port, appSettingsDb) => {
  if (!port) { throw new Error('You must specify a server port'); }
  if (!appSettingsDb) { throw new Error('You must specify a settings database'); }

  const appSettings = settings(new Datastore({ filename: appSettingsDb, autoload: true }));

  return appSettings.get()
    .then(ensurePemKeyPair)
    .then(appSettings.set)
    .then(currentAppSettings => new Server(port, currentAppSettings));
};

const serverTaskHandler = server =>
  ({ action }) => {
    switch (action) {
      case STOP_SERVER:
        return process.exit();
      case REQUEST_SERVER_STATUS:
        return process.send({
          action: SERVER_STATUS,
          data: server.status(),
        });
      default:
        return false;
    }
  };

if (require.main === module) {
  startServer(process.env.PORT, process.env.APP_SETTINGS_DB).then((server) => {
    process.on('message', serverTaskHandler(server));
    process.send({ action: SERVER_READY });
  });
}

// Module exports:

class ServerProcess {
  constructor({ ps }) {
    this.process = ps;
  }

  stop() {
    this.process.send({ action: STOP_SERVER });
  }

  send(data) {
    this.process.send(data);
  }

  on(cb) {
    this.process.on('message', (message) => {
      cb(message);
    });
  }
}

const createServer = (port, db) =>
  new Promise((resolve) => {
    const ps = fork(`${__filename}`, [], { env: { PORT: port, APP_SETTINGS_DB: db } });
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
  ServerProcess,
};
