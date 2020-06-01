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
  includeUnresolved: true,
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
    networkOptions,
  ) {
    const protocolId = protocol._id;

    const {
      useEgoData,
      exportNetworkUnion,
      enableEntityResolution,
      resolutionId,
      includeUnresolved,
    } = { ...defaultNetworkOptions, ...networkOptions };

    if (!enableEntityResolution) {
      return this.getSessionNetworks(protocolId)
        .then(networks => (useEgoData ? insertEgoInNetworks(networks) : networks))
        .then(networks => (exportNetworkUnion ? [unionOfNetworks(networks)] : networks));
    }

    const transformOptions = { useEgoData, resolutionId, includeUnresolved };

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

  saveResolution(protocolId, parameters, transforms) {
    return this.resolverDB.insertResolution(protocolId, parameters, transforms);
  }

  // Delete all resolutions ater and including resolutionId
  deleteResolutionsFromId(protocolId, resolutionId) {
    return this.getResolutions(protocolId)
      // Get all resolutions up to and including resolutionId
      .then((resolutions) => {
        const resolutionIndex = resolutions
          .findIndex(resolution => resolution._id === resolutionId);
        return resolutions.slice(0, resolutionIndex + 1);
      })
      .then(resolutions => resolutions.map(({ _id }) => _id))
      .then(resolutionIds =>
        this.resolverDB.deleteResolutions(resolutionIds)
          .then(() => resolutionIds),
      );
  }

  resolveProtocol(
    protocol,
    options,
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }

    const codebook = transposedCodebook(protocol.codebook);

    const command = `${options.entityResolutionPath} ${options.entityResolutionArguments}`;
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
