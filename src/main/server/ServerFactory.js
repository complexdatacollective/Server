const Server = require('./Server');
const { ensurePemKeyPair } = require('./certificateManager');
const { ready: cipherReady } = require('../utils/shared-api/cipher');
const { deviceServiceEvents } = require('./devices/DeviceService');

// Guarantee cipher functions ready before other services start up
// @return an instance of Server
const startServer = (dataDir, httpPort, httpsPort) => (
  cipherReady
    .then(ensurePemKeyPair)
    .then((keys) => new Server({ dataDir, keys }))
    .then((server) => server.startServices(httpPort, httpsPort))
);

/**
 * Creates the worker services. For Electron, must run in the main process.
 * @async
 * @return {Server} the high-level Server instance which manages all services
 * @throws {Error} If port or dataDir are not supplied
 */
const createServer = (dataDir, httpPort, httpsPort) => {
  if (!dataDir) { return Promise.reject(new Error('You must specify a user data directory')); }
  return startServer(dataDir, httpPort, httpsPort);
};

module.exports = {
  createServer,
  serverEvents: { ...deviceServiceEvents },
};
