/* eslint-disable no-underscore-dangle */

const path = require('path');
const { last, get, findLast, trim } = require('lodash');
const logger = require('electron-log');
const { getNetworkResolver } = require('../utils/getNetworkResolver');
const { transformSessions, formatSession, formatResolution } = require('../utils/resolver/transformSessions');
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

    this.getResolvedSessions(protocolId, options.resolutionId, options.egoCastType)
      .then(([[network], { codebook }]) =>
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
  getResolvedSessions(
    protocolId,
    resolutionId,
    initialEgoCastType = undefined,
    includeUnresolved = true,
  ) {
    return Promise.all([
      this.protocolDb.get(protocolId),
      this.getSessions(protocolId),
      this.getResolutions(protocolId, resolutionId),
    ])
      .then(
        ([protocol, sessions, resolutions]) => {
          const lastResolution = last(resolutions);
          const lastSession = last(sessions);

          // Assumption: All exports henceforth will have the same ego cast type
          const egoCastType = get(lastResolution, ['options', 'egoCastType'], initialEgoCastType);

          if (!egoCastType) { throw new Error('No ego cast type provided'); }

          const transformOptions = {
            includeUnresolved,
            egoCastType,
          };

          const [resolvedNetwork, resolvedProtocol] = transformSessions(protocol, sessions, resolutions, transformOptions);

          const resolvedSessions = [{
            ...resolvedNetwork,
            ego: {}, // TODO: hack fix for ego
            sessionVariables: {
              caseId: 'resolved',
              sessionId: resolutionId,
              protocolUID: protocolId,
              protocolName: lastSession.sessionVariables.protocolName,
              codebookHash: lastSession.sessionVariables.codebookHash,
              sessionExported: new Date(),
            },
          }];

          return [
            resolvedSessions,
            resolvedProtocol,
          ];
        },
      );
  }

  getResolutionsWithSessionCounts(protocolId) {
    return Promise.all([
      this.getResolutions(protocolId),
      this.sessionDb.findAll(protocolId, null, { createdAt: 1 }),
    ])
      .then(([resolutions, sessions]) => {
        const sessionCounts = sessions
          .reduce((acc, session) => {
            const { _id } = findLast(resolutions, ({ date }) => date > session.createdAt) || { _id: '_unresolved' };
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
