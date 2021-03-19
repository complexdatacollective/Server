const eventTypes = {
  RESOLVE_REQUEST: 'RESOLVE_REQUEST',
  RESOLVE_END: 'RESOLVE_END',
  RESOLVE_DATA: 'RESOLVE_DATA',
  RESOLVE_ERROR: 'RESOLVE_ERROR',
  RESOLVE_ABORT: 'RESOLVE_ABORT',
};

const getEventName = (eventType, requestId) => `${eventType}_${requestId}`;

module.exports = {
  eventTypes,
  getEventName,
};
