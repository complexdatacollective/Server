const { ipcMain } = require('electron');
const logger = require('electron-log');
const ProtocolManager = require('../data-managers/ProtocolManager');
const { ResolverManager } = require('../data-managers/ResolverManager');

const eventTypes = {
  RESOLVE_REQUEST: 'RESOLVE_REQUEST',
  RESOLVE_END: 'RESOLVE_END',
  RESOLVE_DATA: 'RESOLVE_DATA',
  RESOLVE_ERROR: 'RESOLVE_ERROR',
  // RESOLVE_RESULT: 'RESOLVE_RESULT',
};

const getEventName = (eventType, requestId) =>
  `${eventType}_${requestId}`;

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
class ResolverService {
  constructor({ dataDir }) {
    this.protocolManager = new ProtocolManager(dataDir);
    this.resolverManager = new ResolverManager(this.protocolManager);
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
    logger.debug('[ResolverService:request]', eventTypes.RESOLVE_REQUEST, protocolId, requestId, JSON.stringify(options));
    // const ipcs = new IPCStream(requestId, event.sender, { emitClose: true });

    const handleError = (error) => {
      logger.debug('[ResolverService:error]', error.message);
      const message = error.message || error;
      event.sender.send(getEventName(eventTypes.RESOLVE_ERROR, requestId), message);
    };

    this.resolveProtocol(protocolId, options)
      .then((resolverStream) => {
        resolverStream.on('data', (data) => {
          logger.debug('[ResolverService:data]', data);
          event.sender.send(getEventName(eventTypes.RESOLVE_DATA, requestId), data);
        });
        resolverStream.on('error', (_, e) => handleError(e));
        resolverStream.on('end', () => {
          logger.debug('END');
          event.sender.send(getEventName(eventTypes.RESOLVE_END, requestId));
        });
        // const handleStreamError = (error) => {
        //   const message = error.message || error;
        //   logger.debug('[ResolverService:stream]', `Error: ${message}`);
        //   ipcs.write(JSON.stringify({ error: { message, stack: error.stack } }));
        //   resolverStream.abort();
        // };

        // // This is a requirement of the 'end' event, all data must be processed before
        // // 'end' is emitted.
        // ipcs.on('data', () => {
        //   // noop
        //   logger.debug('[ResolverService:data]');
        // });

        // ipcs.on('end', () => {
        //   logger.debug('[ResolverService]', 'Killing process');
        //   resolverStream.abort();
        // });

        // // IPCStream is not a true stream and does not support errors, perhaps consider
        // // using plain IPC messages?
        // resolverStream.on('error', handleStreamError);

        // resolverStream.pipe(ipcs);
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
