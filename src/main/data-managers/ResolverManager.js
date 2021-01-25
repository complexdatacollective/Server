/* eslint-disable no-underscore-dangle */

const { last, get } = require('lodash');
const { RequestError, ErrorMessages } = require('../errors/RequestError');
const { getNetworkResolver } = require('../utils/getNetworkResolver');
const { transformSessions } = require('../utils/resolver/transformSessions');
const { formatSessionAsNetwork, insertEgoInNetworks } = require('../utils/formatters/network');

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

    const optionsWithDefaults = { ...defaultNetworkOptions, ...networkOptions };

    return Promise.all([
      this.getSessionNetworks(protocolId),
      this.protocolManager.getResolutions(protocolId),
    ])
      .then(
        ([sessions, resolutions]) => {
          const lastResolution = last(resolutions);

          // Assumption: All exports henceforce will have the same ego cast type
          const egoCastType = get(lastResolution, ['parameters', 'egoCastType']);

          const transformOptions = {
            resolutionId: optionsWithDefaults.resolutionId,
            includeUnresolved: optionsWithDefaults.includeUnresolved,
            egoCastType,
          };

          return transformSessions(protocol, sessions, resolutions, transformOptions);
        },
      )
      .then(network => ([network]));
  }

  getSessionNetworks(protocolId) {
    return this.protocolManager.sessionDb.findAll(protocolId, null, null)
      .then(sessions => sessions.map(formatSessionAsNetwork))
      .then(networks => insertEgoInNetworks(networks));
  }

  resolveProtocol(
    requestId,
    protocol,
    options,
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }

    const resolverOptions = options.resolverOptions;

    const command = [
      resolverOptions.interpreterPath,
      resolverOptions.resolverPath,
      resolverOptions.args,
    ];

    return this.getNetwork(protocol, options)
      .then(([network]) => getNetworkResolver(requestId, command, protocol.codebook, network));
  }
}

module.exports = {
  ResolverManager,
  default: ResolverManager,
};
