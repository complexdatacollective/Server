const libsodium = require('libsodium-wrappers');

const Server = require('./Server');
const ensurePemKeyPair = require('./ensurePemKeyPair');
const { deviceServiceEvents } = require('./devices/DeviceService');

// Guarantee libsodium is ready before other services start up
// @return an instance of Server
const startServer = (port, dataDir) => (
  libsodium.ready
    .then(ensurePemKeyPair)
    .then(keys => new Server({ dataDir, keys }))
    .then(server => server.startServices(port))
);

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
  serverEvents: { ...deviceServiceEvents },
};
