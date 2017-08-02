const { fork } = require('child_process');
const PrivateSocket = require('private-socket');
const Datastore = require('nedb');
const Server = require('./Server');
const settings = require('./settings');

const SERVER_READY = 'SERVER_READY';
const STOP_SERVER = 'STOP_SERVER';
const SERVER_STATUS = 'SERVER_STATUS';
const REQUEST_SERVER_STATUS = 'REQUEST_SERVER_STATUS';

/**
 * This files runs in two modes:
 * 1. As a main process, in which case it automatically initialises a Server
 *    based on environment variables PORT and APP_SETTINGS_DB
 * 2. As a module, in which case it exports the createServer() method, which
 *    will spawn this file as a new process (see 1. above), and return the
 *    process wrapped in a ServerProcess instance.
 *
 * It mignt make sense to break it down into separate files/modules.
 */

// 1. Running as a main process:

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

const startServer = (port, settingsDb) => {
  if (!port) { throw new Error('You must specify a server port'); }
  if (!settingsDb) { throw new Error('You must specify a settings database'); }

  const appSettings = settings(new Datastore({ filename: settingsDb, autoload: true }));

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

// 1. Running as a module:

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

  on(action, cb) {
    this.process.on('message', (message) => {
      if (action === message.action) {
        cb(message);
      }
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
