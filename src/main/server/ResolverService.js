const { ipcMain } = require('electron');
const logger = require('electron-log');
const ProtocolManager = require('../data-managers/ProtocolManager');
const ResolverManager = require('../data-managers/ResolverManager');

// TODO: can we share this with the client?
const eventTypes = {
  RESOLVE_REQUEST: 'RESOLVE_REQUEST',
  RESOLVE_END: 'RESOLVE_END',
  RESOLVE_DATA: 'RESOLVE_DATA',
  RESOLVE_ERROR: 'RESOLVE_ERROR',
  RESOLVE_ABORT: 'RESOLVE_ABORT',
};

// TODO:  can we share this with the client?
const getEventName = (eventType, requestId) =>
  `${eventType}_${requestId}`;

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
class ResolverService {
  constructor({ dataDir }) {
    this.resolvers = [];
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
    ipcMain.on(eventTypes.RESOLVE_ABORT, this.onResolveAbort.bind(this));
  }

  stop() {
    // stop listening?
    ipcMain.removeListener(eventTypes.RESOLVE_REQUEST, this.onResolveRequest.bind(this));
  }

  onResolveAbort(event, requestId) {
    logger.debug('[ResolverService:abort]', eventTypes.RESOLVE_ABORT, requestId);
    if (!this.resolvers[requestId]) { return; }
    this.resolvers[requestId].abort();
    delete this.resolvers[requestId];
  }

  onResolveRequest(event, requestId, protocolId, options) {
    logger.debug('[ResolverService:request]', eventTypes.RESOLVE_REQUEST, protocolId, requestId, JSON.stringify(options));

    const handleError = (error) => {
      logger.error('[ResolverService:error]', error);
      event.sender.send(getEventName(eventTypes.RESOLVE_ERROR, requestId), error);
    };

    if (this.resolvers[requestId]) {
      handleError(new Error('This requestId already exists'));
    }

    this.resolverManager.resolveProtocol(protocolId, requestId, options)
      .then((resolverStream) => {
        this.resolvers[requestId] = resolverStream;

        resolverStream.on('data', (data) => {
          event.sender.send(getEventName(eventTypes.RESOLVE_DATA, requestId), data.toString());
        });

        resolverStream.on('error', e => handleError(e));

        resolverStream.on('end', () => {
          logger.debug('[ResolverService:end]');
          event.sender.send(getEventName(eventTypes.RESOLVE_END, requestId));
        });

        resolverStream.on('close', () => {
          logger.debug('[ResolverService:close]');
          event.sender.send(getEventName(eventTypes.RESOLVE_END, requestId));
        });
      })
      .catch(handleError);
  }
}

module.exports = { ResolverService };
