const { ipcRenderer } = require('electron');
const uuid = require('uuid');
const { through, pipe } = require('mississippi');
const IPCStream = require('electron-ipc-stream');

const debugStream = prefix => through(
  (chunk, enc, cb) => {
    console.log(`[stream: ${prefix}]`, chunk.toString());
    cb(null, chunk);
  },
  (cb) => {
    cb(null);
  },
);

// Make our IPCStream emit events
const IPCErrorTranform = through((chunk, encoding, callback) => {
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

      resolve(pipe(ipcStream(), IPCErrorTranform, debugStream('out')));

      ipcRenderer.send(eventTypes.RESOLVE_REQUEST, requestId, protocolId, options);
    });
  }
}

module.exports = resolverClient;
