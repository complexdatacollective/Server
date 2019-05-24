/**
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
  FilelistNotSingular: 'Multiple files must be uploaded separately',
  FileNotChanged: 'No need to update - file has not been changed',
  InvalidContainerFile: 'Invalid file',
  InvalidContainerFileExtension: 'File must have a ".netcanvas" extension',
  InvalidPairingCode: 'Incorrect pairing code',
  InvalidProtocolFormat: 'Invalid protocol format',
  InvalidRequestBody: 'Could not parse request data',
  InvalidZip: 'Invalid ZIP file',
  InvalidExportOptions: 'Invalid export options',
  MissingProtocolFile: 'Missing protocol file',
  NotFound: 'Not found',
  NothingToExport: 'No data available to export',
  ProtocolAlreadyExists: 'Cannot overwrite previously imported protocols. Rename or remove from the app, and try again',
  ProtocolNotFoundForSession: 'The associated protocol does not exist on this server',
  VerificationFailed: 'Request verification failed',
};

module.exports = {
  default: RequestError,
  RequestError,
  ErrorMessages,
};
