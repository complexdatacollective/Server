const { ipcRenderer } = require('electron');
const uuid = require('uuid');
const IPCStream = require('electron-ipc-stream');

const eventTypes = {
  RESOLVE_REQUEST: 'RESOLVE_REQUEST',
};

/**
 * Provides an IPC API for resolution clients on the same machine.
 */
class resolverClient {
  static request(protocolId, options) {
    const requestId = `resolve-request-${uuid()}`;

    return new Promise((resolve) => {
      const ipcs = new IPCStream(requestId);

      resolve(ipcs);

      ipcRenderer.send(eventTypes.RESOLVE_REQUEST, requestId, protocolId, options);
    });
  }
}

module.exports = resolverClient;
