/* eslint-disable no-underscore-dangle */

const path = require('path');
const ResolverDB = require('./ResolverDB');
const CommandRunner = require('../utils/commandRunner');
const { RequestError, ErrorMessages } = require('../errors/RequestError');

/**
 * Interface for data resolution
 */
class ResolverManager {
  constructor(dataDir) {
    const resolverDBFile = path.join(dataDir, 'db', 'resolver.db');
    this.resolverDB = new ResolverDB(resolverDBFile);
  }

  resolveNetwork(
    protocol,
    {
      useDirectedEdges,
      useEgoData,
      command,
    } = {},
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }
    // TODO: we don't need 'this.'
    this.commandRunner = new CommandRunner(command);

    commandRunnner.write();
  }
}

module.exports = ResolverManager;
