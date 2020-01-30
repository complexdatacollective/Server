/* eslint-disable no-underscore-dangle */

const path = require('path');
const ResolverDB = require('./ResolverDB');

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
    } = {},
  ) {
    return Promise.resolve(null);
  }
}

module.exports = ResolverManager;
