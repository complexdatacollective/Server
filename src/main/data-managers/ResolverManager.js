/* eslint-disable no-underscore-dangle */

const { RequestError, ErrorMessages } = require('../errors/RequestError');
const { getNetworkResolver } = require('../utils/getNetworkResolver');
const { transformSessions } = require('../utils/resolver/transformSessions');
const { formatSessionAsNetwork } = require('../utils/formatters/network');

const defaultNetworkOptions = {
  enableEntityResolution: true,
  includeUnresolved: true,
  resolutionId: null,
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
      resolutionId,
      includeUnresolved,
      egoCastType,
    } = { ...defaultNetworkOptions, ...networkOptions };

    const transformOptions = { resolutionId, includeUnresolved, egoCastType };

    return Promise.all([
      this.getSessionNetworks(protocolId),
      this.protocolManager.getResolutions(protocolId),
    ])
      .then(
        ([sessions, resolutions]) =>
          transformSessions(protocol, sessions, resolutions, transformOptions),
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
