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
  ProtocolAlreadyExists: 'This protocol has already been imported, and cannot be overwritten. If you have changed your protocol since importing it, either rename it to create a new workspace, or remove the existing protocol.',
  ProtocolNotFoundForSession: 'The associated protocol does not exist on this server',
  VerificationFailed: 'Request verification failed',
};

module.exports = {
  default: RequestError,
  RequestError,
  ErrorMessages,
};
