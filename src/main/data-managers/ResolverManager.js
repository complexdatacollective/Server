/* eslint-disable no-underscore-dangle */

const path = require('path');
const ResolverDB = require('./ResolverDB');
const SessionDB = require('./SessionDB');
const commandRunner = require('../utils/commandRunner');
const { RequestError, ErrorMessages } = require('../errors/RequestError');
const {
  insertEgoInNetworks,
  transposedCodebook,
  unionOfNetworks,
} = require('../utils/formatters/network');
const {
  AttributeListFormatter,
} = require('../utils/formatters/index');

const networkResolver = ({
  command,
  codebook,
} = {}) =>
  network =>
    new Promise((resolve, reject) => {
      const formatter = new AttributeListFormatter(network, false, false, codebook);
      const resolver = commandRunner(command);
      resolver.on('error', (err) => { reject(err); });
      formatter.writeToStream(resolver); // does this need to happen later?
      resolve(resolver);
    });

/**
 * Interface for data resolution
 */
class ResolverManager {
  constructor(dataDir) {
    const resolverDBFile = path.join(dataDir, 'db', 'resolver.db');
    this.resolverDB = new ResolverDB(resolverDBFile);
    const sessionDbFile = path.join(dataDir, 'db', 'sessions.db');
    this.sessionDB = new SessionDB(sessionDbFile);
  }

  getNetwork(
    protocol,
    { useEgoData } = {},
  ) {
    return this.sessionDB
      .findAll(protocol._id, null, null)
      .then(sessions => sessions.map((session) => {
        const id = session && session._id;
        const caseID = session && session.data && session.data.sessionVariables &&
          session.data.sessionVariables._caseID;
        return { ...session.data, _id: id, _caseID: caseID };
      }))
      .then(networks => (useEgoData ? insertEgoInNetworks(networks) : networks))
      .then(networks => unionOfNetworks(networks));
  }

  resolveNetwork(
    protocol,
    {
      useEgoData,
      command,
    } = {},
  ) {
    if (!protocol) {
      return Promise.reject(new RequestError(ErrorMessages.NotFound));
    }

    const codebook = transposedCodebook(protocol.codebook);

    return this.getNetwork(protocol, { useEgoData })
      .then(networkResolver({ useEgoData, command, codebook }));
  }
}

module.exports = ResolverManager;
