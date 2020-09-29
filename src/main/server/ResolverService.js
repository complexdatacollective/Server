const { ipcMain } = require('electron');
const logger = require('electron-log');
const ProtocolManager = require('../data-managers/ProtocolManager');
// const { ResolverManager } = require('../data-managers/ResolverManager');

// UI message types, these get sent between main/renderer
const ipcEventTypes = {
  // Request entity resolution for protocol {protocolId}
  RESOLVE: 'RESOLVER/RESOLVE',
  // Abort entity resolution {resolutionId}
  ABORT: 'RESOLVER/ABORT',
  // entity resolution finished {resolutionId}
  END: 'RESOLVER/END',
  // Something went wrong { resolutionId, error }
  ERROR: 'RESOLVER/ERROR',
  // Request user feedback {resolutionId, type, payload}
  QUERY: 'RESOLVER/QUERY',
  // Mark pair as {resolutionId, type, payload}
  RESPONSE: 'RESOLVER/RESPONSE',
};

// Resolver message types, these get sent between the app and the resolver script
const messageTypes = {
  RESOLVE: 'RESOLVE',
  MATCH: 'MATCH',
  MAYBE: 'MAYBE',
  REJECT: 'REJECT',
  LOG: 'LOG',
};

const makeGetRequestEventName = requestId => eventType =>
  `${eventType}/${requestId}`;

const readData = (data) => {
  const [type, payload] = data.toString().split(' ');
  return [type, JSON.parse(payload)];
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

  onResolve(event, { protocolId, requestId, options }) {
    logger.debug(event, protocolId, requestId, JSON.stringify(options));
    const getRequestEventName = makeGetRequestEventName(requestId);

    const handleError = (error) => {
      logger.error(ipcEventTypes.ERROR, error);
      event.sender.send(getRequestEventName(ipcEventTypes.ERROR), { error });
    };

    const handleEnd = () => {
      logger.debug(getRequestEventName(ipcEventTypes.END));
      event.sender.send(getRequestEventName(ipcEventTypes.END));
    };

    if (this.resolvers[requestId]) {
      handleError(new Error('This requestId already exists'));
    }

    this.getResolver(options)
      .then((resolverStream) => {
        this.resolvers[requestId] = resolverStream;

        // emit for each line
        resolverStream.on('data', (data) => {
          // parse events
          const [type, payload] = readData(data);

          switch (type) {
            // MATCH/REJECT handled in stream??
            case messageTypes.MAYBE:
              // Send to UI
              event.sender.send(ipcEventTypes.QUERY, payload);
              return;
            case messageTypes.LOG:
            default:
              logger.debug(type, payload);
          }
        });

        resolverStream.on('error', e => handleError(e));
        resolverStream.on('end', handleEnd);
        resolverStream.on('close', handleEnd);
      })
      .catch(handleError);
  }

  onResponse(event, { requestId, type, payload }) {
    logger.debug(event, requestId, type, payload);
    switch (type) {
      case messageTypes.MATCH:
      case messageTypes.REJECT:
        this.resolvers[requestId].send(type, payload);
        return;
      default:
        logger.debug(type, payload);
    }
  }
}

module.exports = {
  ResolverService,
};
