
// UI message types, these get sent between main/renderer
const ipcEventTypes = {
  // Request entity resolution for protocol {protocolId}
  RESOLVE: 'RESOLVER/RESOLVE',
  // Abort entity resolution {requestId}
  ABORT: 'RESOLVER/ABORT',
  // entity resolution finished {requestId}
  END: 'RESOLVER/END',
  // Something went wrong { requestId, error }
  ERROR: 'RESOLVER/ERROR',
  // Request user feedback {requestId, type, payload}
  QUERY: 'RESOLVER/QUERY',
  // Mark pair as {requestId, type, payload}
  RESPONSE: 'RESOLVER/RESPONSE',
};

// Resolver message types, these get sent between the app and the resolver script
const resolverMessageTypes = {
  RESOLVE: 'RESOLVE',
  MATCH: 'MATCH',
  MAYBE: 'MAYBE',
  REJECT: 'REJECT',
  LOG: 'LOG',
};

const getIpcEventId = (eventType, requestId) =>
  `${eventType}/${requestId}`;

module.exports = {
  ipcEventTypes,
  resolverMessageTypes,
  getIpcEventId,
};
