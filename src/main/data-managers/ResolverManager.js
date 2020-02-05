/* eslint-disable no-underscore-dangle */

const path = require('path');
const split = require('split');
const { Transform } = require('stream');
const TransformCsvToJson = require('../utils/TransformCsvToJson');
const { convertUuidToDecimal, nodePrimaryKeyProperty, nodeAttributesProperty } = require('../utils/formatters/network');
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

class StreamMapper extends Transform {
  constructor(mapFunc, options) {
    super(options);
    this._mapFunc = mapFunc;
  }

  _transform(data, encoding, callback) {
    callback(null, this._mapFunc(data));
  }
}

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

const findNode = findId =>
  (node) => {
    const id = convertUuidToDecimal(node[nodePrimaryKeyProperty]);
    return id === findId;
  };

const getAttributesForNode = (network, id) => {
  const node = network.nodes.find(findNode(id));

  if (!node) { return id; }

  return {
    id,
    [nodeAttributesProperty]: node[nodeAttributesProperty],
  };
};

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
      .then(network =>
        networkResolver({ useEgoData, command, codebook })(network)
          .then((resolverStream) => {
            const jsonStream = new TransformCsvToJson();
            const networkMapper = new StreamMapper((pair) => {
              const obj = JSON.parse(pair);

              const a = getAttributesForNode(network, obj.networkCanvasAlterID_1);
              const b = getAttributesForNode(network, obj.networkCanvasAlterID_2);

              const r = {
                a,
                b,
                prob: parseFloat(obj.prob),
              };

              return JSON.stringify(r);
            });

            resolverStream
              .pipe(split())
              .pipe(jsonStream)
              .pipe(networkMapper);

            return networkMapper;
          }),
      );
  }
}

module.exports = ResolverManager;
