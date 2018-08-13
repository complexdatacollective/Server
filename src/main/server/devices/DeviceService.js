const { EventEmitter } = require('events');
const logger = require('electron-log');

const { DeviceAPI, apiEvents } = require('./DeviceAPI');
const { emittedEvents: pairingEvents, outOfBandDelegate } = require('./OutOfBandDelegate');

const DefaultApiPort = process.env.DEVICE_SERVICE_PORT || 51001;

const emittedEvents = {
  ...apiEvents,
  ...pairingEvents,
};

/**
 * Provides APIs for external client devices running
 * [Network Canvas]{@link https://github.com/codaco/Network-Canvas}.
 *
 * Services:
 * - Device Pairing
 */
class DeviceService extends EventEmitter {
  constructor({ dataDir, keys }) {
    super();
    this.api = this.createApi(dataDir, keys);
  }

  get port() { return this.api.port; }

  createApi(dataDir, keys) { // eslint-disable-line class-methods-use-this
    return new DeviceAPI(dataDir, outOfBandDelegate, keys);
  }

  start(port = DefaultApiPort) {
    return this.api.listen(parseInt(port, 10))
      .then((api) => {
        logger.info(`${api.name} listening at ${api.url}`);
        logger.info(`${api.name} listening at ${api.secureUrl}`);
        return api;
      });
  }

  /**
   * @async
   * @return {Promise}
   */
  stop() {
    return this.api.close();
  }

  on(name, cb) {
    let emitter = null;
    if (apiEvents && apiEvents[name]) {
      emitter = this.api;
    }

    if (emitter) {
      logger.debug('Delegating', name, 'to', emitter.constructor.name);
      emitter.on(name, cb);
    } else {
      super.on(name, cb);
    }

    return this;
  }
}

module.exports = {
  DeviceService,
  DefaultApiPort,
  deviceServiceEvents: emittedEvents,
};
