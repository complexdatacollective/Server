const { ipcRenderer } = require('electron');
const uuid = require('uuid/v4');
const { EventEmitter } = require('events');
const { getEventName, eventTypes } = require('./resolverClientEvents');

const makeResolverResult = (requestId) => {
  const emitter = new EventEmitter();

  const handleError = (e) => {
    emitter.emit('error', e);
    emitter.emit('end');
  };

  ipcRenderer.on(getEventName(eventTypes.RESOLVE_END, requestId), () => {
    emitter.emit('end');
  });

  ipcRenderer.on(getEventName(eventTypes.RESOLVE_DATA, requestId), (event, data) => {
    try {
      const parsedData = JSON.parse(data);

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

  emitter.abort = () => {
    ipcRenderer.send(eventTypes.RESOLVE_ABORT, requestId);
  };

  return emitter;
};

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
const resolveProtocol = (protocolId, options) => {
  const requestId = uuid();

  return new Promise((resolve) => {
    const resolver = makeResolverResult(requestId);

    ipcRenderer.send(eventTypes.RESOLVE_REQUEST, requestId, protocolId, options);

    resolve({ requestId, resolver });
  });
};

module.exports = resolveProtocol;
