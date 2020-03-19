const { ipcRenderer } = require('electron');
const uuid = require('uuid');
const { through, pipeline } = require('mississippi');
const IPCStream = require('electron-ipc-stream');

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
};

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
class resolverClient {
  static resolveProtocol(protocolId, options) {
    const requestId = `resolve-request-${uuid()}`;

    return new Promise((resolve) => {
      const ipcStream = () => new IPCStream(requestId);

      const stream = pipeline(ipcStream(), IPCErrorTranform());

      stream.abort = () => {
        stream.end();
        stream.destroy();
      };

      ipcRenderer.send(eventTypes.RESOLVE_REQUEST, requestId, protocolId, options);

      resolve(stream);
    });
  }
}

module.exports = resolverClient;
