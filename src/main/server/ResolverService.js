const { ipcMain } = require('electron');
const logger = require('electron-log');
const IPCStream = require('electron-ipc-stream');
const apiRequestLogger = require('./apiRequestLogger');
const ProtocolManager = require('../data-managers/ProtocolManager');
const ResolverManager = require('../data-managers/ResolverManager');

const eventTypes = {
  RESOLVE_REQUEST: 'RESOLVE_REQUEST',
};

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
class ResolverService {
  constructor({ dataDir }) {
    this.protocolManager = new ProtocolManager(dataDir);
    this.resolverManager = new ResolverManager(dataDir);
  }

  /**
   * Start API listening on an open port.
   * @param  {string|number} port number in valid range [1024,65535]
   * @return {Promise}
   */
  start() {
    // start listening?
    ipcMain.on(eventTypes.RESOLVE_REQUEST, this.onResolveRequest.bind(this));
  }

  stop() {
    // stop listening?
    ipcMain.removeListener(eventTypes.RESOLVE_REQUEST, this.onResolveRequest.bind(this));
  }

  onResolveRequest(event, requestId, protocolId, options) {
    logger.debug('[ResoverService]', eventTypes.RESOLVE_REQUEST, protocolId, requestId, JSON.stringify(options));
    const ipcs = new IPCStream(requestId, event.sender);

    this.request(protocolId, options)
      .then((resolverStream) => {
        resolverStream.pipe(ipcs);
      });
  }

  request(protocolId, options) {
    return this.protocolManager.getProtocol(protocolId)
      .then(protocol =>
        this.resolverManager.resolveNetwork(protocol, options),
      )
      .catch((err) => {
        logger.error(err);
      });
  }
}

module.exports = {
  ResolverService,
};
