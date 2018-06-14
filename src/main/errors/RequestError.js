/**
 * @class RequestError
 *
 * @description
 * Used to indicate an error with a request to a data manager; for example,
 * an incorrect, missing, or malformed filename when importing a protocol.
 *
 * API services can use this to distinguish between client input errors and
 * unexpected (server) errors.
 */
class RequestError extends Error {
  constructor(message) {
    super(message);
    this.name = 'RequestError';
  }
}

const ErrorMessages = {
  DecryptionFailed: 'Decryption failed',
  EmptyFilelist: 'Empty filelist',
  InvalidFile: 'Invalid File',
  InvalidProtocolFormat: 'Invalid Protocol Format',
  InvalidPayload: 'Payload parsing failed',
  MissingProtocol: 'Missing protocol',
  VerificationFailed: 'Request verification failed',
};

module.exports = {
  default: RequestError,
  RequestError,
  ErrorMessages,
};
