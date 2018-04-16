const path = require('path');
const PrivateSocket = require('private-socket');
const Datastore = require('nedb');
const libsodium = require('libsodium-wrappers');

const Server = require('./Server');
const settings = require('./settings');

const { deviceServiceEvents } = require('./deviceService');

const ensurePemKeyPair = (currentAppSettings) => {
  if (!currentAppSettings || !currentAppSettings.keys) {
    return PrivateSocket.generatePemKeyPair()
      .then(
        keypair =>
          Object.assign({}, currentAppSettings, { keys: keypair }),
      );
  }

  return currentAppSettings;
};

const startServer = (port, dataDir) => {
  const settingsDb = path.join(dataDir, 'db', 'settings');
  const appSettings = settings(new Datastore({ filename: settingsDb, autoload: true }));

  // Guarantee libsodium is ready before other services start up
  return libsodium.ready.then(() => appSettings.get())
    .then(ensurePemKeyPair)
    .then(serverOptions => Object.assign({}, serverOptions, {
      dataDir,
    }))
    .then(appSettings.set)
    .then(currentAppSettings => new Server(currentAppSettings))
    .then(server => server.startServices(port))
    .then(server => server);
};

/**
 * Creates the worker services. For Electron, must run in the main process.
 * @async
 * @return {Server} the high-level Server instance which manages all services
 * @throws {Error} If port or dataDir are not supplied
 */
const createServer = (port, dataDir) => {
  if (!port) { return Promise.reject(new Error('You must specify a server port')); }
  if (!dataDir) { return Promise.reject(new Error('You must specify a user data directory')); }
  return startServer(port, dataDir);
};

module.exports = {
  createServer,
  serverEvents: Object.assign({}, deviceServiceEvents),
};
