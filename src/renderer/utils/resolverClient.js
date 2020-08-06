const { ipcRenderer } = require('electron');
const uuid = require('uuid');
const { EventEmitter } = require('events');
const { getEventName, eventTypes } = require('./resolverClientEvents');

const makeResolverResult = (requestId) => {
  const emitter = new EventEmitter();

  const handleError = (e) => {
    emitter.emit('error', new Error(e));
    emitter.emit('end');
  };

  ipcRenderer.on(getEventName(eventTypes.RESOLVE_END, requestId), () => {
    emitter.emit('end');
  });

  ipcRenderer.on(getEventName(eventTypes.RESOLVE_DATA, requestId), (event, data) => {
    try {
      const parsedData = JSON.parse(data.toString());

      if (parsedData.error) {
        handleError(parsedData.error);
        return;
      }

      emitter.emit('match', parsedData);
    } catch (e) {
      handleError(e);
    }
  });

  ipcRenderer.on(
    getEventName(eventTypes.RESOLVE_ERROR, requestId),
    (_, error) => handleError(error),
  );

  return emitter;
};

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
class resolverClient {
  static resolveProtocol(protocolId, options) {
    const requestId = uuid();

    return new Promise((resolve) => {
      const resolverResult = makeResolverResult(requestId);

      ipcRenderer.send(eventTypes.RESOLVE_REQUEST, requestId, protocolId, options);

      resolve(resolverResult);
    });
  }
}

module.exports = resolverClient;
