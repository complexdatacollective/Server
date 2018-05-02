const { EventEmitter } = require('events');

const logger = require('electron-log');

const { DeviceAPI } = require('./DeviceAPI');

const DefaultApiPort = process.env.DEVICE_SERVICE_PORT || 51001;

const emittedEvents = {
  PAIRING_CODE_AVAILABLE: 'PAIRING_CODE_AVAILABLE',
  PAIRING_COMPLETE: 'PAIRING_COMPLETE',
};

/**
 * Provides APIs for external client devices running
 * [Network Canvas]{@link https://github.com/codaco/Network-Canvas}.
 *
 * Services:
 * - Device Pairing
 */
class DeviceService extends EventEmitter {
  constructor({ dataDir }) {
    super();
    this.api = this.createApi(dataDir);
  }

  get port() { return this.api.port; }

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

  // TODO: May return boolean to indicate nothing registered as listener;
  // may want to adjust client response (error code) in that case. (TBD.)
  get outOfBandDelegate() {
    return {
      pairingDidBeginWithCode: (pairingCode) => {
        this.emit(
          emittedEvents.PAIRING_CODE_AVAILABLE,
          { pairingCode },
        );
      },
      pairingDidComplete: () => {
        this.emit(emittedEvents.PAIRING_COMPLETE);
      },
    };
  }
}

module.exports = {
  DeviceService,
  deviceServiceEvents: emittedEvents,
};
