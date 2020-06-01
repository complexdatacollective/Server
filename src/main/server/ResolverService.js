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
    logger.debug('[ResolverService]', eventTypes.RESOLVE_REQUEST, protocolId, requestId, JSON.stringify(options));
    const ipcs = new IPCStream(requestId, event.sender, { emitClose: true });

    const handleError = (error) => {
      logger.debug('[ResolverService]', `Error: ${error.message}`);
    };

    this.resolveProtocol(protocolId, options)
      .then((resolverStream) => {
        const handleStreamError = (error) => {
          const message = error.message || error;
          logger.debug('[ResolverService:stream]', `Error: ${message}`);
          ipcs.write(JSON.stringify({ error: { message, stack: error.stack } }));
          resolverStream.abort();
        };

        // This is a requirement of the 'end' event, all data must be processed before
        // 'end' is emitted.
        ipcs.on('data', () => {
          // noop
          logger.debug('[ResolverService:data]');
        });

        ipcs.on('end', () => {
          logger.debug('[ResolverService]', 'Killing process');
          resolverStream.abort();
        });

        // IPCStream is not a true stream and does not support errors, perhaps consider
        // using plain IPC messages?
        resolverStream.on('error', handleStreamError);

        resolverStream.pipe(ipcs);
      })
      .catch(handleError);
  }

  resolveProtocol(protocolId, options) {
    return this.protocolManager.getProtocol(protocolId)
      .then(protocol => this.resolverManager.resolveProtocol(protocol, options));
  }
}

module.exports = {
  ResolverService,
};
