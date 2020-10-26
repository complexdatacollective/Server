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
  InvalidFileExtension: 'This file has an invalid file extension and was not imported. Files must have a ".netcanvas" or ".graphml" extension.',
  InvalidContainerFileExtension: 'File must have a ".netcanvas" extension',
  InvalidSessionFileExtension: 'File must have a ".graphml" extension',
  InvalidPairingCode: 'Incorrect pairing code',
  InvalidProtocolFormat: 'Invalid protocol format',
  InvalidSessionFormat: 'Invalid case format',
  InvalidRequestBody: 'Could not parse request data',
  InvalidZip: 'Invalid ZIP file',
  InvalidExportOptions: 'Invalid export options',
  MissingProtocolFile: 'Missing protocol file',
  NotFound: 'Not found',
  NothingToExport: 'No data available to export',
  ProtocolAlreadyExists: 'This protocol has already been imported. Rename it and try again to create a new workspace, or remove the existing protocol',
  ProtocolNotFoundForSession: 'The protocol used by this session does not exist. Import it, and try again',
  SessionAlreadyExists: 'This session already exists in Server (matched an existing session ID), and so cannot be imported again.',
  VerificationFailed: 'Request verification failed',
};

module.exports = {
  default: RequestError,
  RequestError,
  ErrorMessages,
};
