const { ipcRenderer } = require('electron');
const uuid = require('uuid');
const { EventEmitter } = require('events');
const { through, pipeline } = require('mississippi');
// const IPCStream = require('electron-ipc-stream');

// Make our IPCStream emit events
const IPCErrorTranform = () => through((chunk, encoding, callback) => {
  const data = JSON.parse(chunk.toString());
  // IPC streams aren't real streams so we use a custom error message
  if (data.error) {
    callback(data.error);
    return;
  }

  callback(null, chunk);
});

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
    emitter.emit('error', e);
    emitter.emit('end');
  };

  ipcRenderer.on(getEventName(eventTypes.RESOLVE_END, requestId), () => {
    emitter.emit('end');
    console.log('resolve end');
  });

  ipcRenderer.on(getEventName(eventTypes.RESOLVE_DATA, requestId), (data) => {
    try {
      const parsedData = JSON.parse(data.toString());

      if (parsedData.error) {
        handleError(parsedData.error);
        return;
      }

      console.log('data');
      emitter.emit('match', parsedData);
    } catch (e) {
      handleError(e);
    }
  });

  throw new Error('listen for' + getEventName(eventTypes.RESOLVE_ERROR, requestId));

  ipcRenderer.on(getEventName(eventTypes.RESOLVE_ERROR, requestId), (data) => {
    handleError(data);
  });
};

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
class resolverClient {
  static resolveProtocol(protocolId, options) {
    const requestId = `resolve-request-${uuid()}`;

    return new Promise((resolve) => {
      const resolverResult = makeResolverResult(requestId);

      ipcRenderer.send(eventTypes.RESOLVE_REQUEST, requestId, protocolId, options);

      resolve(resolverResult);
    });
  }
}

module.exports = resolverClient;
