/* eslint-disable no-underscore-dangle */

const path = require('path');
const { last, get, findLast } = require('lodash');
// const { RequestError, ErrorMessages } = require('../errors/RequestError');
const { getNetworkResolver } = require('../utils/getNetworkResolver');
const { transformSessions } = require('../utils/resolver/transformSessions');
const ResolverDB = require('./ResolverDB');
const SessionDB = require('./SessionDB');
const ProtocolDB = require('./ProtocolDB');
const { dbFilePaths } = require('./config');
// const { formatSessionAsNetwork, insertEgoInNetworks } = require('../utils/formatters/network');

const formatSession = ({ data }) => data;

const formatResolution = ({
  _id,
  updatedAt,
  transforms,
  options,
}) => ({
  id: _id,
  date: updatedAt,
  transformCount: transforms.length,
  options,
  transforms,
});

// const defaultNetworkOptions = {
//   enableEntityResolution: true,
//   includeUnresolved: true,
//   resolutionId: null,
// };

/**
 * Interface for data resolution
 */
class ResolverManager {
  constructor(dataDir) {
    const dbFile = path.join(dataDir, ...dbFilePaths.resolver);
    this.db = new ResolverDB(dbFile);

    const sessionDbFile = path.join(dataDir, ...dbFilePaths.sessions);
    this.sessionDb = new SessionDB(sessionDbFile);

    const protocolDbFile = path.join(dataDir, ...dbFilePaths.protocols);
    this.protocolDb = new ProtocolDB(protocolDbFile);
  }

  resolveProtocol(
    protocolId,
    requestId,
    options,
  ) {
    const command = [
      options.interpreterPath,
      options.resolverPath,
      options.args,
    ];

    return Promise.all([
      this.protocolDb.get(protocolId),
      this.getResolvedSessions(protocolId, options),
    ])
      .then(
        ([{ codebook }, [network]]) =>
          getNetworkResolver(requestId, command, codebook, network),
      );
  }

  getSessions(protocolId) {
    return this.sessionDb.findAll(protocolId, null, null)
      .then(sessions => sessions.map(formatSession));
  }

  // TODO: prior to resolution id?
  getResolutions(protocolId, resolutionId = null) {
    return this.db.getResolutions(protocolId, resolutionId)
      .then(resolutions => resolutions.map(formatResolution));
  }

  // Returns sessions as a resolved network
  // Formatted as `[session]`, so that it is similar to a list of sessions.
  getResolvedSessions(protocolId, options, includeUnresolved = true) {
    return Promise.all([
      this.protocolDb.get(protocolId),
      this.getSessions(protocolId),
      this.getResolutions(protocolId, get(options, 'resolutionId')),
    ])
      .then(
        ([protocol, sessions, resolutions]) => {
          const lastResolution = last(resolutions);

          // Assumption: All exports henceforth will have the same ego cast type
          const egoCastType = get(lastResolution, ['parameters', 'egoCastType'], options.egoCastType);

          const transformOptions = {
            includeUnresolved,
            egoCastType,
          };

          return transformSessions(protocol, sessions, resolutions, transformOptions);
        },
      )
      .then(network => ([network]));
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

  saveResolution(protocolId, resolution) {
    return this.db.insertResolution(protocolId, resolution);
  }

  // Delete all resolutions after and INCLUDING resolutionId
  deleteResolutions(protocolId, { from: resolutionId } = {}) {
    if (!resolutionId) { throw Error('No resolution id specified: `deleteResolutions(protocolId, { from: resolutionId })`'); }
    return this.getResolutions(protocolId)
      // Get all resolutions after and including resolutionId
      .then((resolutions) => {
        const resolutionIndex = resolutions
          .findIndex(resolution => resolution.id === resolutionId);

        if (resolutionIndex === -1) { return []; }

        const ids = resolutions
          .slice(resolutionIndex)
          .map(({ id }) => id);

        return ids;
      })
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
