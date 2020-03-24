/* eslint-disable no-underscore-dangle */

const path = require('path');
const { RequestError, ErrorMessages } = require('../errors/RequestError');
const {
  insertEgoInNetworks,
  transposedCodebook,
  unionOfNetworks,
} = require('../utils/formatters/network');
const { getNetworkResolver } = require('../utils/getNetworkResolver');
const { transformSessions } = require('../utils/transformSessions');
const ResolverDB = require('./ResolverDB');
const SessionDB = require('./SessionDB');

const defaultNetworkOptions = {
  enableEntityResolution: true,
  resolutionId: null,
};

const formatResolution = resolution => ({
  ...resolution,
  _meta: {
    id: resolution._id,
    date: resolution.createdAt,
  },
});

const formatSessionAsNetwork = (session) => {
  const id = session && session._id;
  const caseID = session && session.data && session.data.sessionVariables &&
    session.data.sessionVariables._caseID;
  return ({
    ...session.data,
    _meta: {
      caseID,
      id,
      date: session.createdAt,
    },
  });
};

/**
 * Interface for data resolution
 */
class ResolverManager {
  constructor(dataDir) {
    const resolverDBFile = path.join(dataDir, 'db', 'resolver.db');
    this.resolverDB = new ResolverDB(resolverDBFile);
    const sessionDbFile = path.join(dataDir, 'db', 'sessions.db');
    this.sessionDB = new SessionDB(sessionDbFile);
  }

  getNetwork(
    protocol,
    {
      useEgoData,
      exportNetworkUnion,
      enableEntityResolution,
      resolutionId,
    } = defaultNetworkOptions,
  ) {
    const protocolId = protocol._id;

    if (!enableEntityResolution) {
      return this.getSessionNetworks(protocolId)
        .then(networks => (useEgoData ? insertEgoInNetworks(networks) : networks))
        .then(networks => (exportNetworkUnion ? [unionOfNetworks(networks)] : networks));
    }

    const transformOptions = { useEgoData, resolutionId };

    return Promise.all([
      this.getSessionNetworks(protocolId),
      this.getResolutions(protocolId),
    ])
      .then(
        ([sessions, resolutions]) =>
          transformSessions(sessions, resolutions, transformOptions),
      )
      .then(network => ([network]));
  }

  getSessionNetworks(protocolId) {
    // TODO: should this filter by data for performance?
    return this.sessionDB.findAll(protocolId, null, null)
      .then(sessions => sessions.map(formatSessionAsNetwork));
  }

  getResolutions(protocolId) {
    return this.resolverDB.getResolutions(protocolId)
      .then(resolutions => resolutions.map(formatResolution));
  }

  saveResolution(protocolId, options, transforms) {
    return this.resolverDB.insertResolution(protocolId, options, transforms);
  }

  resolveProtocol(
    protocol,
    options,
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }

    const codebook = transposedCodebook(protocol.codebook);

    const command = options.entityResolutionPath;
    const resolverOptions = { codebook };

    const networkResolver = getNetworkResolver(command, resolverOptions);

    return this.getNetwork(protocol, options)
      .then(([network]) => networkResolver(network));
  }
}

module.exports = {
  ResolverManager,
  default: ResolverManager,
};
