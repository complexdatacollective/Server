const { ipcMain } = require('electron');
const logger = require('electron-log');
const ProtocolManager = require('../data-managers/ProtocolManager');
// const { ResolverManager } = require('../data-managers/ResolverManager');

// UI message types
const ipcEventTypes = {
  // Request entity resolution for protocol {protocolId}
  RESOLVE: 'RESOLVER/RESOLVE',
  // Abort entity resolution {resolutionId}
  ABORT: 'RESOLVER/ABORT',
  // Request user feedback {type} {id1} {id2}
  QUERY: 'RESOLVER/QUERY',
  // Mark pair as {match/fail} {id1} {id2}
  RESPONSE: 'RESOLVER/RESPONSE',
};

const messageTypes = {
  request: {
    RESOLVE: 'RESOLVE',
  },
  response: {
    MATCH: 'MATCH',
    MAYBE: 'MAYBE',
    REJECT: 'REJECT',
    LOG: 'LOG',
  },
};

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
class ResolverService {
  constructor({ dataDir }) {
    console.log('resolver service');
    this.resolvers = [];
    this.protocolManager = new ProtocolManager(dataDir);
    // this.resolverManager = new ResolverManager(this.protocolManager);
  }

  /**
   * Start API listening to IPC events
   * @return {Promise}
   */
  start() {
    // start listening
    Object.keys(ipcEventTypes).forEach((key) => {
      const handlerName = `on${key[0].toUpperCase()}${key.substring(1).toLowerCase()}`;
      if (!this[handlerName]) {
        logger.warn(`Could not find handler ${handlerName} (${ipcEventTypes[key]})`);
        return;
      }
      ipcMain.on(ipcEventTypes[key], this[handlerName].bind(this));
    });
  }

  stop() {
    // stop listening
    Object.keys(ipcEventTypes).forEach((key) => {
      const handlerName = `on${key[0].toUpperCase()}${key.substring(1).toLowerCase()}`;
      if (!this[handlerName]) { return; }
      ipcMain.removeListener(ipcEventTypes[key], this[handlerName].bind(this));
    });
  }

// // TODO:  can we share this with the client?
// const getEventName = (eventType, requestId) =>
// `${eventType}_${requestId}`;

  // onResolveAbort(event, requestId) {
  //   logger.debug('[ResolverService:abort]', eventTypes.RESOLVE_ABORT, requestId);
  //   if (!this.resolvers[requestId]) { return; }
  //   this.resolvers[requestId].abort();
  //   delete this.resolvers[requestId];
  // }

  // onResolveRequest(event, requestId, protocolId, options) {
  //   logger.debug('[ResolverService:request]', eventTypes.RESOLVE_REQUEST, protocolId, requestId, JSON.stringify(options));

  //   const handleError = (error) => {
  //     logger.error('[ResolverService:error]', error);
  //     event.sender.send(getEventName(eventTypes.RESOLVE_ERROR, requestId), error);
  //   };

  //   if (this.resolvers[requestId]) {
  //     handleError(new Error('This requestId already exists'));
  //   }

  //   this.resolveProtocol(requestId, protocolId, options)
  //     .then((resolverStream) => {
  //       this.resolvers[requestId] = resolverStream;

  //       resolverStream.on('data', (data) => {
  //         event.sender.send(getEventName(eventTypes.RESOLVE_DATA, requestId), data.toString());
  //       });

  //       resolverStream.on('error', e => handleError(e));

  //       resolverStream.on('end', () => {
  //         logger.debug('[ResolverService:end]');
  //         event.sender.send(getEventName(eventTypes.RESOLVE_END, requestId));
  //       });

  //       resolverStream.on('close', () => {
  //         logger.debug('[ResolverService:close]');
  //         event.sender.send(getEventName(eventTypes.RESOLVE_END, requestId));
  //       });
  //     })
  //     .catch(handleError);
  // }

  // resolveProtocol(requestId, protocolId, options) {
  //   return this.protocolManager.getProtocol(protocolId)
  //     .then(protocol => this.resolverManager.resolveProtocol(requestId, protocol, options));
  // }
}

module.exports = {
  ResolverService,
};
