/**
 * Used to indicate an error specific to the pairing process with a client.
 *
 * Error messages are assumed to be user-facing.
 */
class IncompletePairingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IncompletePairingError';
  }
}

// TODO: codes along with these? Factory instead?
const ErrorMessages = {
  PairingCancelledByUser: 'Pairing was cancelled',
  PairingRequestTimedOut: 'Pairing timed out',
  PairingCodeExpired: 'Pairing window expired',
  PairingGuiUnavailable: 'The main window must be open on this Server',
};

module.exports = {
  default: IncompletePairingError,
  IncompletePairingError,
  ErrorMessages,
};
