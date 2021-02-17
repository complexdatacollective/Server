const { sortBy, last } = require('lodash');
const { transformSessions } = require('./transformSessions');
const castOrphanEgosAsEgoNodes = require('./castOrphanEgosAsEgoNodes');
const mergeResolutionMetaAsAttributes = require('./mergeResolutionMetaAsAttributes');

const resolve = (
  protocol,
  sessions,
  resolutions,
  options,
) => {
  // default options
  const optionsWithDefaults = {
    includeUnresolved: true,
    asExport: false,
    ...options,
  };

  const sortedResolutions = sortBy(resolutions, ['date']);
  const sortedSessions = sortBy(sessions, ['date']);

  // Apply transforms to session and return resolved network
  const resolvedNetwork = transformSessions(
    protocol,
    sortedSessions,
    sortedResolutions,
    optionsWithDefaults,
  );

  // If we are only using this to feed the resolver script we don't need to
  // use the final export steps
  if (!optionsWithDefaults.asExport) {
    return [[resolvedNetwork], protocol];
  }

  const lastResolution = last(sortedResolutions);
  const lastSession = last(sortedSessions);

  if (!lastResolution) {
    throw new Error('No resolution to export?');
  }

  const sessionId = lastResolution.uuid;

  const sessionVariables = {
    caseId: 'Entity Resolution',
    sessionId,
    protocolUID: protocol._id, // eslint-disable-line no-underscore-dangle
    protocolName: lastSession.sessionVariables.protocolName,
    codebookHash: lastSession.sessionVariables.codebookHash,
    sessionExported: new Date(),
  };

  // Convert any previous cast egos that are still orphans into a
  // new node type '_ego', and add them to the network
  const [egoNetwork, egoProtocol] = castOrphanEgosAsEgoNodes(
    sortedSessions,
    protocol,
    resolvedNetwork,
  );

  // Merge caseId and parentId into node.attributes
  const mergedNetwork = mergeResolutionMetaAsAttributes(egoNetwork);

  return [
    [{ ...mergedNetwork, ego: {}, sessionVariables }],
    egoProtocol,
  ];
};

module.exports = resolve;
