/**
 * @class IncompletePairingError
 *
 * @description
 * Used to indicate an error with a request to a data manager; for example,
 * an incorrect, missing, or malformed filename when importing a protocol.
 *
 * API services can use this to distinguish between client input errors and
 * unexpected (server) errors.
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
};

module.exports = {
  default: IncompletePairingError,
  IncompletePairingError,
  ErrorMessages,
};
