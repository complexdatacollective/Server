const logger = require('electron-log');

const { DeviceAPI } = require('./DeviceAPI');

const DefaultApiPort = process.env.DEVICE_SERVICE_PORT || 51001;

const ipcActions = {
  PAIRING_CODE_AVAILABLE: 'PAIRING_CODE_AVAILABLE',
  PAIRING_COMPLETE: 'PAIRING_COMPLETE',
};

/**
 * @memberof BackgroundServices
 * @class DeviceService
 * Provides APIs for external client devices running
 * [Network Canvas]{@link https://github.com/codaco/Network-Canvas}.
 *
 * Services:
 * - Device Pairing
 */
class DeviceService {
  constructor({ dataDir }) {
    this.api = this.createApi(dataDir);
  }

  createApi(dataDir) {
    return new DeviceAPI(dataDir, this.outOfBandDelegate);
  }

  start(port = DefaultApiPort) {
    return this.api.listen(port).then((api) => {
      logger.info(`${api.name} listening at ${api.url}`);
      return api;
    });
  }

  stop() {
    return this.api.close();
  }

  get outOfBandDelegate() {
    return {
      pairingDidBeginWithCode: (pairingCode) => {
        this.messageParent({
          action: ipcActions.PAIRING_CODE_AVAILABLE,
          data: { pairingCode },
        });
      },
      pairingDidCompleteWithCode: (pairingCode) => {
        this.messageParent({
          action: ipcActions.PAIRING_COMPLETE,
          data: { pairingCode },
        });
      },
    };
  }

  // TODO: move, and stub the delegate in tests
  // eslint-disable-next-line class-methods-use-this
  messageParent(data) {
    if (process.send) {
      process.send(data);
    } else {
      logger.error('No parent available for IPC');
    }
  }
}

module.exports = {
  DeviceService,
  deviceServiceActions: ipcActions,
};

