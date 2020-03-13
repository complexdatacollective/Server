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

const formatResolution = resolution => ({
  ...resolution,
  id: resolution._id,
});

const formatSession = (session) => {
  const id = session && session._id;
  const caseID = session && session.data && session.data.sessionVariables &&
    session.data.sessionVariables._caseID;
  return { ...session.data, _id: id, _caseID: caseID };
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
      entityResolutionOptions,
    } = {},
  ) {
    const {
      enableEntityResolution,
      resolutionId,
    } = entityResolutionOptions || {
      enableEntityResolution: false,
      resolutionId: null,
    };

    const protocolId = protocol._id;

    if (!enableEntityResolution) {
      return this.getSessions(protocolId)
        .then(networks => (useEgoData ? insertEgoInNetworks(networks) : networks))
        .then(networks => (exportNetworkUnion ? [unionOfNetworks(networks)] : networks));
    }

    const transformOptions = { useEgoData, resolutionId };

    return Promise.all([
      this.getSessions(protocolId),
      this.getResolutions(protocolId),
    ])
      .then(
        ([sessions, resolutions]) =>
          transformSessions(sessions, resolutions, transformOptions),
      );
  }

  getSessions(protocolId) {
    return this.sessionDB.findAll(protocolId, null, null)
      .then(sessions => sessions.map(formatSession));
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
    {
      useEgoData,
      command,
    } = {},
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }

    const codebook = transposedCodebook(protocol.codebook);
    const networkResolver = getNetworkResolver({ useEgoData, command, codebook });

    return this.getNetwork(protocol, { useEgoData })
      .then(networkResolver);
  }
}

module.exports = {
  ResolverManager,
  default: ResolverManager,
};
