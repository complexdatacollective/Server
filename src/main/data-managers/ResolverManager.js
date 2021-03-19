/* eslint-disable no-underscore-dangle */

const path = require('path');
const {
  last, get, findLast, trim, sortBy,
} = require('lodash');
const logger = require('electron-log');
const { getNetworkResolver } = require('../utils/getNetworkResolver');
const { formatSession, formatResolution } = require('../utils/resolver/helpers');
const resolve = require('../utils/resolver/resolve');
const ResolverDB = require('./ResolverDB');
const SessionDB = require('./SessionDB');
const ProtocolDB = require('./ProtocolDB');
const { dbFilePaths } = require('./config');

const parseArgs = (args) => {
  if (trim(args).length === 0) { return []; }
  return trim(args).split(' ');
};

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
    const args = parseArgs(options.args);

    logger.warn({ args });

    const command = [
      options.interpreterPath,
      options.resolverPath,
      ...parseArgs(options.args),
    ];

    logger.warn({ command });
    // TODO: fix

    return this.getResolvedSessions(protocolId, options.resolutionId, options.egoCastType)
      .then(([[network], { codebook }]) => getNetworkResolver(requestId, command, codebook, network));
  }

  getSessions(protocolId) {
    return this.sessionDb.findAll(protocolId, null, null)
      .then((sessions) => sessions.map(formatSession));
  }

  // TODO: prior to resolution id?
  getResolutions(protocolId, resolutionId = null) {
    return this.db.getResolutions(protocolId, resolutionId)
      .then((resolutions) => resolutions.map(formatResolution));
  }

  // Returns sessions as a resolved network
  // Formatted as `[session]`, so that it is similar to a list of sessions.
  getResolvedSessions(
    protocolId,
    resolutionId,
    initialEgoCastType = undefined,
    includeUnresolved = true, // Include unresolved _sessions_
    asExport = false, // Convert unresolved (cast) egos, into ego nodes after resolution.
  ) {
    return Promise.all([
      this.protocolDb.get(protocolId),
      this.getSessions(protocolId),
      this.getResolutions(protocolId, resolutionId),
    ])
      .then(
        ([protocol, sessions, resolutions]) => {
          const lastResolution = last(resolutions);

          // Assumption: All exports henceforth will have the same ego cast type
          const egoCastType = get(lastResolution, ['options', 'egoCastType'], initialEgoCastType);

          if (!egoCastType) { throw new Error('No ego cast type provided'); }

          const resolveOptions = {
            includeUnresolved,
            asExport,
            egoCastType,
          };

          return resolve(protocol, sessions, resolutions, resolveOptions);
        },
      );
  }

  getResolutionsWithSessionCounts(protocolId) {
    return Promise.all([
      this.getResolutions(protocolId),
      this.sessionDb.findAll(protocolId, null, { createdAt: 1 }),
    ])
      .then(([resolutions, sessions]) => ([sortBy(resolutions, 'date'), sortBy(sessions, 'createdAt')]))
      .then(([resolutions, sessions]) => {
        resolutions.reverse();
        const sessionCounts = sessions
          .reduce((acc, session) => {
            const { id } = findLast(resolutions, ({ date }) => date > session.createdAt) || { id: '_unresolved' };
            return {
              ...acc,
              [id]: get(acc, id, 0) + 1,
            };
          }, {});

        const unresolved = get(sessionCounts, '_unresolved', 0);

        const resolutionsWithCount = resolutions
          .map(({ transforms, ...resolution }) => ({
            ...resolution,
            sessionCount: get(sessionCounts, resolution.id, 0),
          }));

        return { resolutions: resolutionsWithCount, unresolved };
      });
  }

  saveResolution(protocolId, resolution) {
    return this.db.insertResolution(protocolId, resolution);
  }

  // Delete all resolutions after and INCLUDING resolutionId
  deleteResolution(protocolId, resolutionId) {
    if (!resolutionId) { throw Error('No resolution id specified: `deleteResolution(protocolId, resolutionId)`'); }
    return this.getResolutions(protocolId)
      // Get all resolutions after and including resolutionId
      .then((resolutions) => {
        const resolutionIndex = resolutions
          .findIndex((resolution) => resolution.id === resolutionId);

        if (resolutionIndex === -1) { return []; }

        const ids = resolutions
          .slice(resolutionIndex)
          .map(({ id }) => id);

        return ids;
      })
      .then((resolutionIds) => this.db.deleteResolutions(resolutionIds)
        .then(() => resolutionIds));
  }

  // Delete all resolutions after and INCLUDING date
  deleteResolutionsSince(protocolId, date) {
    if (!date) { throw Error('No resolution date specified: `deleteResolutionsSince(protocolId, date)`'); }
    return this.db.deleteResolutionsSince(protocolId, date);
  }

  // Delete all resolutions related to a protocol
  // Used when we delete that protocol, or sessions connected
  // to that protocol
  deleteProtocolResolutions(protocolId) {
    return this.db.deleteProtocolResolutions(protocolId);
  }
}

module.exports = ResolverManager;
