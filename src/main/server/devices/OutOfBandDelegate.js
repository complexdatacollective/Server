/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const { ipcMain } = require('electron');

const { sendToGui } = require('../../guiProxy');
const { IncompletePairingError, ErrorMessages } = require('../../errors/IncompletePairingError');

const emittedEvents = {
  PAIRING_CODE_AVAILABLE: 'PAIRING_CODE_AVAILABLE',
  PAIRING_COMPLETE: 'PAIRING_COMPLETE',
  PAIRING_TIMED_OUT: 'PAIRING_TIMED_OUT',
};

const PairingAckObservers = {};
const ObserverTimeouts = {};
const ObserverTimeoutDurationMillis = 30000;

/**
 * outOfBandDelegate provides hooks between the device API and GUI for the out-of-band
 * pairing process.
 * @type {Object}
 * @namespace outOfBandDelegate
 */
const outOfBandDelegate = {
  /**
   * @description
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

    const onPairingTimeout = () => {
      removeListeners(); // eslint-disable-line no-use-before-define
      sendToGui(emittedEvents.PAIRING_TIMED_OUT);
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

    const guiIsReady = sendToGui(emittedEvents.PAIRING_CODE_AVAILABLE,
      { pairingCode: pairingRequest.pairingCode, id: pairingRequest._id });

    let promise;

    if (guiIsReady) {
      promise = new Promise((resolve, reject) => {
        PairingAckObservers[requestId] = { resolve, reject };
      });
      ObserverTimeouts[requestId] = setTimeout(onPairingTimeout, ObserverTimeoutDurationMillis);

      ipcMain.once('PairingCodeAcknowledged', onPairingCodeAcknowledged);
      ipcMain.once('PairingCodeDismissed', onPairingCodeDismissed);
    } else {
      promise = Promise.reject(new IncompletePairingError(ErrorMessages.PairingGuiUnavailable));
    }

    return {
      promise,
      abort: onPairingTimeout,
    };
  },

  /**
   * When a pairing request has been confirmed by the client (via the API), notifies the GUI
   * @return {void}
   */
  pairingDidComplete: () => {
    sendToGui(emittedEvents.PAIRING_COMPLETE);
  },
};

module.exports = {
  emittedEvents,
  outOfBandDelegate,
};
