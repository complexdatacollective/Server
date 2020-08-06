const { ipcMain } = require('electron');
const logger = require('electron-log');
const ProtocolManager = require('../data-managers/ProtocolManager');
const { ResolverManager } = require('../data-managers/ResolverManager');

// TODO: share this with the client?
const eventTypes = {
  RESOLVE_REQUEST: 'RESOLVE_REQUEST',
  RESOLVE_END: 'RESOLVE_END',
  RESOLVE_DATA: 'RESOLVE_DATA',
  RESOLVE_ERROR: 'RESOLVE_ERROR',
};

// TODO: share this with the client?
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

    const handleError = (error) => {
      logger.debug('[ResolverService:error]', error.message || error.toString());
      event.sender.send(getEventName(eventTypes.RESOLVE_ERROR, requestId), error);
    };

    this.resolveProtocol(protocolId, options)
      .then((resolverStream) => {
        resolverStream.on('data', (data) => {
          logger.debug('[ResolverService:data]', data);
          event.sender.send(getEventName(eventTypes.RESOLVE_DATA, requestId), data);
        });
        resolverStream.on('error', (_, e) => handleError(e));
        resolverStream.on('end', () => {
          logger.debug('[ResolverService:end]');
          event.sender.send(getEventName(eventTypes.RESOLVE_END, requestId));
        });
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
