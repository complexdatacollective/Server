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
  FilelistNotSingular: 'Multiple files must be uploaded separately',
  InvalidContainerFile: 'Invalid File',
  InvalidContainerFileExtension: 'File must have a ".netcanvas" extension',
  InvalidProtocolFormat: 'Invalid Protocol Format',
  InvalidRequestBody: 'Could not parse request data',
  InvalidZip: 'Invalid ZIP File',
  MissingProtocolFile: 'Missing protocol file',
  NotFound: 'Not Found',
  ProtocolNotFoundForSession: 'The associated protocol does not exist on this server',
  VerificationFailed: 'Request verification failed',
};

module.exports = {
  default: RequestError,
  RequestError,
  ErrorMessages,
};
