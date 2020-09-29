const { ipcMain } = require('electron');
const logger = require('electron-log');
// const ProtocolManager = require('../../data-managers/ProtocolManager');
const { resolverMessageTypes, ipcEventTypes, getIpcEventId } = require('./config');
const Resolver = require('./Resolver');

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
class ResolverService {
  // constructor({ dataDir }) {
  constructor() {
    console.log('Resolver service');
    this.resolvers = [];
    // this.protocolManager = new ProtocolManager(dataDir);
    // // this.resolverManager = new ResolverManager(this.protocolManager);
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

  onAbort(event, { requestId }) {
    logger.debug(event, requestId);
    this.resolvers[requestId].abort();
    delete this.resolvers[requestId];
  }

  onResolve(event, { protocolId, requestId, options }) {
    logger.debug(event, protocolId, requestId, JSON.stringify(options));

    if (this.resolvers[requestId]) {
      const error = new Error('This requestId already exists');
      logger.error(ipcEventTypes.ERROR, error);
      event.sender.send(getIpcEventId(ipcEventTypes.ERROR, requestId), { error });
    }

    this.resolvers[requestId] = new Resolver(event.sender, requestId, protocolId, options);
  }

  onResponse(event, { requestId, type, payload }) {
    logger.debug(event, requestId, type, payload);
    switch (type) {
      case resolverMessageTypes.MATCH:
      case resolverMessageTypes.REJECT:
        this.resolvers[requestId].send(type, payload);
        return;
      default:
        logger.debug(type, payload);
    }
  }
}

module.exports = { ResolverService };
