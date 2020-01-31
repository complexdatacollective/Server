/* eslint-disable no-underscore-dangle */

const path = require('path');
const ResolverDB = require('./ResolverDB');
const promiseSpawn = require('../utils/promiseSpawn');
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
    protocol, {
      destinationFilepath,
      exportFormats,
      exportNetworkUnion,
      useDirectedEdges,
      useEgoData,
      command,
    } = {},
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }

    const data = 'hello world';

    return promiseSpawn(command, data);
  }
}

module.exports = ResolverManager;
