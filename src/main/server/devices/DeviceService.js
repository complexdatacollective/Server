/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const { EventEmitter } = require('events');
const { ipcMain } = require('electron');
const logger = require('electron-log');

const { DeviceAPI, apiEvents } = require('./DeviceAPI');
const { IncompletePairingError, ErrorMessages } = require('../../errors/IncompletePairingError');

const DefaultApiPort = process.env.DEVICE_SERVICE_PORT || 51001;

const emittedEvents = {
  ...apiEvents,
  PAIRING_CODE_AVAILABLE: 'PAIRING_CODE_AVAILABLE',
  PAIRING_COMPLETE: 'PAIRING_COMPLETE',
  PAIRING_TIMED_OUT: 'PAIRING_TIMED_OUT',
};

const ObserverTimeoutDurationMillis = 30000;
const PairingAckObservers = {};
const ObserverTimeouts = {};

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
    return this.api.listen(parseInt(port, 10)).then((api) => {
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
      /**
       * When a pairing request is created:
       * - emit availability to GUI.
       * - register an acknowledgement observer, and return the promise of acknowledgement
       *
       * At this point, one of three things can happen:
       * - Request acknowledged: promise is resolved
       * - Request dismissed: promise is rejected
       * - Request times out: promise is rejected
       *
       *  Each of these states has a handler, which upon firing cleans up other handlers
       * and resolves or rejects the acknowledgement promise, allowing the API to respond to client.
       *
       * @param {Object} pairingRequest
       * @return {Object} containing a `promise`d acknowledgement, and an `abort` function
       *   to support client-side request cancellations.
       */
      pairingDidBeginWithRequest: (pairingRequest) => {
        const requestId = pairingRequest._id;

        this.emit(
          emittedEvents.PAIRING_CODE_AVAILABLE,
          { pairingCode: pairingRequest.pairingCode },
        );

        const dequeueObserver = () => {
          const promise = PairingAckObservers[requestId];
          delete PairingAckObservers[requestId];
          return promise;
        };

        // register with renderer for ack
        const onPairingCodeAcknowledged = () => {
          removeListeners(); // eslint-disable-line no-use-before-define
          const promise = dequeueObserver();
          promise.resolve(pairingRequest);
        };

        const onPairingCodeDismissed = () => {
          removeListeners(); // eslint-disable-line no-use-before-define
          const promise = dequeueObserver();
          promise.reject(new IncompletePairingError(ErrorMessages.PairingCancelledByUser));
        };

        // Timeout: request error (408)? Gateway (504)?
        const onPairingTimeout = () => {
          removeListeners(); // eslint-disable-line no-use-before-define
          // Main process can notify GUI
          this.emit(emittedEvents.PAIRING_TIMED_OUT);
          const promise = dequeueObserver();
          promise.reject(new IncompletePairingError(ErrorMessages.PairingRequestTimedOut));
        };

        const removeListeners = () => {
          const timeout = ObserverTimeouts[requestId];
          clearTimeout(timeout);
          delete ObserverTimeouts[requestId];
          ipcMain.removeListener('PairingCodeAcknowledged', onPairingCodeAcknowledged);
          ipcMain.removeListener('PairingCodeDismissed', onPairingCodeDismissed);
        };

        ipcMain.once('PairingCodeAcknowledged', onPairingCodeAcknowledged);
        ipcMain.once('PairingCodeDismissed', onPairingCodeDismissed);

        ObserverTimeouts[requestId] = setTimeout(onPairingTimeout, ObserverTimeoutDurationMillis);

        return {
          promise: new Promise((resolve, reject) => {
            PairingAckObservers[requestId] = { resolve, reject };
          }),
          abort: onPairingTimeout,
        };
      },

      pairingDidComplete: () => {
        this.emit(emittedEvents.PAIRING_COMPLETE);
      },
    };
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
