/* eslint-disable no-underscore-dangle */

const path = require('path');
const { last, get, findLast } = require('lodash');
const { RequestError, ErrorMessages } = require('../errors/RequestError');
const { getNetworkResolver } = require('../utils/getNetworkResolver');
const { transformSessions } = require('../utils/resolver/transformSessions');
const ResolverDB = require('./ResolverDB');
const SessionDB = require('./SessionDB');
// const { formatSessionAsNetwork, insertEgoInNetworks } = require('../utils/formatters/network');

const formatResolution = resolution => ({
  // ...resolution,
  _id: resolution._id,
  date: resolution.updatedAt,
  transformCount: resolution.transforms.length,
  transforms: resolution.transforms,
});

const defaultNetworkOptions = {
  enableEntityResolution: true,
  includeUnresolved: true,
  resolutionId: null,
};

/**
 * Interface for data resolution
 */
class ResolverManager {
  constructor(dataDir) {
    const dbFile = path.join(dataDir, 'db-6', 'resolver.db');
    this.db = new ResolverDB(dbFile);

    const sessionDbFile = path.join(dataDir, 'db-6', 'sessions.db');
    this.sessionDb = new SessionDB(sessionDbFile);
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

  getResolutions(protocolId) {
    return this.db.getResolutions(protocolId)
      .then(resolutions => resolutions.map(formatResolution));
  }

  getResolutionsWithSessionCounts(protocolId) {
    return Promise.all([
      this.getResolutions(protocolId),
      this.sessionDb.findAll(protocolId, null, { updatedAt: 1 }),
    ])
      .then(([resolutions, sessions]) => {
        const sessionCounts = sessions
          .reduce((acc, session) => {
            const { _id } = findLast(resolutions, ({ date }) => date > session.updatedAt) || { _id: '_unresolved' };
            return {
              ...acc,
              [_id]: get(acc, _id, 0) + 1,
            };
          }, {});

        const unresolved = get(sessionCounts, '_unresolved', 0);

        const resolutionsWithCount = resolutions
          .map(resolution => ({
            ...resolution,
            sessionCount: get(sessionCounts, resolution._id, 0),
          }));

        return { resolutions: resolutionsWithCount, unresolved };
      });
  }

  saveResolution(protocolId, parameters, transforms) {
    return this.db.insertResolution(protocolId, parameters, transforms);
  }

  // Delete all resolutions after and INCLUDING resolutionId
  deleteResolutions(protocolId, { from: resolutionId } = {}) {
    if (!resolutionId) { throw Error('No resolution id specified: `deleteResolutions(protocolId, { from: resolutionId })`'); }
    return this.getResolutions(protocolId)
      // Get all resolutions up to and including resolutionId
      .then((resolutions) => {
        const resolutionIndex = resolutions
          .findIndex(resolution => resolution._id === resolutionId);

        return resolutions.slice(resolutionIndex);
      })
      .then(resolutions => resolutions.map(({ _id }) => _id))
      .then(resolutionIds =>
        this.db.deleteResolutions(resolutionIds)
          .then(() => resolutionIds),
      );
  }

  // Delete all resolutions related to a protocol
  // Used when we delete that protocol, or sessions connected
  // to that protocol
  deleteProtocolResolutions(protocolId) {
    return this.db.deleteProtocolResolutions(protocolId);
  }
}

module.exports = ResolverManager;
