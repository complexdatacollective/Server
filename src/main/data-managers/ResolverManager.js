/* eslint-disable no-underscore-dangle */

const { last, get } = require('lodash');
const { RequestError, ErrorMessages } = require('../errors/RequestError');
const { getNetworkResolver } = require('../utils/getNetworkResolver');
const { transformSessions } = require('../utils/resolver/transformSessions');
// const { formatSessionAsNetwork, insertEgoInNetworks } = require('../utils/formatters/network');

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

  getResolvedNetwork(
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
    return this.protocolManager.sessionDb.findAll(protocolId, null, null);
      // .then(sessions => sessions.map(formatSessionAsNetwork))
      // .then(networks => insertEgoInNetworks(networks));
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


  // resolutions is in format:
  // [{ id, date }, ...]
  getResolutionSessionCounts(protocolId, resolutions = []) {
    return this.sessionDb.findAll(protocolId, null, { updatedAt: 1 })
      .then((sessions) => {
        if (resolutions.length === 0) { return { _unresolved: sessions.length }; }
        const counts = sessions
          .reduce((acc, session) => {
            const { _id } = findLast(resolutions, ({ _date }) => _date > session.updatedAt) || { id: '_unresolved' };
            return {
              ...acc,
              [_id]: get(acc, _id, 0) + 1,
            };
          }, {});

        return counts;
      });
  }

  getResolutions(protocolId) {
    return this.resolverDB.getResolutions(protocolId)
      .then(resolutions => resolutions.map(formatResolution));
  }

  getResolutionsIndex(protocolId) {
    return this.getResolutions(protocolId)
      .then(resolutions =>
        this.getResolutionSessionCounts(protocolId, resolutions)
          .then((sessionCounts) => {
            const unresolved = get(sessionCounts, '_unresolved', 0);

            const resolutionsWithCount = resolutions
              .map(resolution => ({
                ...resolution,
                _sessionCount: get(sessionCounts, resolution._id, 0),
              }));

            return { resolutions: resolutionsWithCount, unresolved };
          }),
      );
  }

  saveResolution(protocolId, parameters, transforms) {
    return this.resolverDB.insertResolution(protocolId, parameters, transforms);
  }

  // Delete all resolutions after and INCLUDING resolutionId
  deleteResolutionsSince(protocolId, resolutionId) {
    return this.getResolutions(protocolId)
      // Get all resolutions up to and including resolutionId
      .then((resolutions) => {
        const resolutionIndex = resolutions
          .findIndex(resolution => resolution._id === resolutionId);

        return resolutions.slice(resolutionIndex);
      })
      .then(resolutions => resolutions.map(({ _id }) => _id))
      .then(resolutionIds =>
        this.resolverDB.deleteResolutions(resolutionIds)
          .then(() => resolutionIds),
      );
  }

  // Delete all resolutions related to a protocol
  // Used when we delete that protocol, or sessions connected
  // to that protocol
  deleteProtocolResolutions(protocolId) {
    return this.resolverDB.deleteProtocolResolutions(protocolId);
  }
}

module.exports = {
  ResolverManager,
  default: ResolverManager,
};
