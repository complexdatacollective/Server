const { ipcMain } = require('electron');
const logger = require('electron-log');
const IPCStream = require('electron-ipc-stream');
const ProtocolManager = require('../data-managers/ProtocolManager');
const { ResolverManager } = require('../data-managers/ResolverManager');

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

    const handleResolverError = (error) => {
      logger.debug('[ResolverService:resolver]', `Error: ${error.message}`);
      ipcs.write(JSON.stringify({ error: { message: error.message, stack: error.stack } }));
      ipcs.destroy();
    };

    const handleError = (error) => {
      logger.debug('[ResolverService:stream]', `Error: ${error.message}`);
      ipcs.destroy();
    };

    this.resolveProtocol(protocolId, options)
      .then((resolverStream) => {
        // IPCStream is not a true stream and does not support errors, perhaps consider
        // using plain IPC messages?
        resolverStream.on('error', handleError);
        resolverStream.pipe(ipcs);
      })
      .catch(handleResolverError);
  }

  resolveProtocol(protocolId, options) {
    return this.protocolManager.getProtocol(protocolId)
      .then(protocol => this.resolverManager.resolveProtocol(protocol, options));
  }
}

module.exports = {
  ResolverService,
};
