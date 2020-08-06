const { ipcRenderer } = require('electron');
const uuid = require('uuid');
const { EventEmitter } = require('events');

const eventTypes = {
  RESOLVE_REQUEST: 'RESOLVE_REQUEST',
  RESOLVE_END: 'RESOLVE_END',
  RESOLVE_DATA: 'RESOLVE_DATA',
  RESOLVE_ERROR: 'RESOLVE_ERROR',
  // RESOLVE_RESULT: 'RESOLVE_RESULT',
};

const getEventName = (eventType, requestId) =>
  `${eventType}_${requestId}`;

const makeResolverResult = (requestId) => {
  const emitter = new EventEmitter();

  const handleError = (e) => {
    console.log('error', e);
    emitter.emit('error', new Error(e));
    emitter.emit('end');
  };

  ipcRenderer.on(getEventName(eventTypes.RESOLVE_END, requestId), () => {
    emitter.emit('end');
    console.log('resolve end');
  });

  ipcRenderer.on(getEventName(eventTypes.RESOLVE_DATA, requestId), (event, data) => {
    try {
      const parsedData = JSON.parse(data.toString());

      if (parsedData.error) {
        handleError(parsedData.error);
        return;
      }

      console.log('data', parsedData);
      emitter.emit('match', parsedData);
    } catch (e) {
      handleError(e);
    }
  });

  console.log('listen for:' + getEventName(eventTypes.RESOLVE_ERROR, requestId));

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
