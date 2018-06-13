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
  EmptyFilelist: 'Empty filelist',
  InvalidFile: 'Invalid File',
  MissingProtocol: 'Missing protocol',
};

module.exports = {
  default: RequestError,
  RequestError,
  ErrorMessages,
};
