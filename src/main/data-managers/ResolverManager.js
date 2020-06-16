/* eslint-disable no-underscore-dangle */

const { RequestError, ErrorMessages } = require('../errors/RequestError');
const {
  insertEgoInNetworks,
  unionOfNetworks,
} = require('../utils/formatters/network');
const { getNetworkResolver } = require('../utils/getNetworkResolver');
const { transformSessions } = require('../utils/transformSessions');

const defaultNetworkOptions = {
  enableEntityResolution: true,
  includeUnresolved: true,
  resolutionId: null,
};

const formatSessionAsNetwork = (session) => {
  const id = session && session._id;
  const caseID = session && session.data && session.data.sessionVariables &&
    session.data.sessionVariables._caseID;

  return ({
    ...session.data,
    _caseID: caseID,
    _id: id,
    _date: session.createdAt,
  });
};

/**
 * Interface for data resolution
 */
class ResolverManager {
  constructor(protocolManager) {
    this.protocolManager = protocolManager;
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
      this.protocolManager.getResolutions(protocolId),
    ])
      .then(
        ([sessions, resolutions]) =>
          transformSessions(sessions, resolutions, transformOptions),
      )
      .then(network => ([network]));
  }

  getSessionNetworks(protocolId) {
    return this.protocolManager.getProtocolSessions(protocolId, null, null)
      .then(sessions => sessions.map(formatSessionAsNetwork));
  }

  resolveProtocol(
    protocol,
    options,
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }

    const command = `${options.entityResolutionPath} ${options.entityResolutionArguments}`;
    const resolverOptions = { codebook: protocol.codebook };

    const networkResolver = getNetworkResolver(command, resolverOptions);

    return this.getNetwork(protocol, options)
      .then(([network]) => networkResolver(network));
  }
}

module.exports = {
  ResolverManager,
  default: ResolverManager,
};
