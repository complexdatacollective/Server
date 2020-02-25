/* eslint-disable no-underscore-dangle */

const path = require('path');
const split = require('split');
const miss = require('mississippi');
const csvToJson = require('../utils/streams/csvToJson');
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

/**
 * nodes are transmitted to the resolver as numerical ids generated
 * by convertUuidToDecimal, this find method handles that additional
 * step.
 */
const findNode = findId =>
  (node) => {
    const id = convertUuidToDecimal(node[nodePrimaryKeyProperty]);
    return id === findId;
  };

const getNode = (network, id) => {
  const node = network.nodes.find(findNode(id));

  if (!node) {
    throw new Error(
      `Corresponding node data for '${id}' (convertUuidToDecimal) could not be found in network object.`
    );
  }

  return {
    [nodePrimaryKeyProperty]: node[nodePrimaryKeyProperty],
    [nodeAttributesProperty]: node[nodeAttributesProperty],
  };
};

/**
 * Given a match which contains ids and a probability, append
 * network data for that node and parse the probabily as a float.
 *
 * { networkCanvasAlterID_1, networkCanvasAlterID_2, prob: '0.0' } ->
 *   { nodes: [ { id, attributes }, { id, attributes } ], prob: 0.0 }
 */
const appendNodeNetworkData = network =>
  miss.through((chunk, encoding, callback) => {
    try {
      const obj = JSON.parse(chunk);

      const nodes = [
        getNode(network, obj.networkCanvasAlterID_1),
        getNode(network, obj.networkCanvasAlterID_2),
      ];

      const prob = parseFloat(obj.prob);

      const result = JSON.stringify({
        nodes,
        prob,
      });

      callback(null, result);
    } catch (err) {
      callback(err);
    }
  });

/**
 * Create a fully formed pipeline that emits each match as a json
 * chunk including original network data for each pair:
 * `{ nodes: [ { id, attributes }, { id, attributes } ], prob: 0.0 }`
 *
 * Because this is a 'pipeline' (https://github.com/maxogden/mississippi#pipeline)
 * if any of the streams emits an error, all the streams in the pipeline
 * will be closed automatically, and the error can be captured on the last
 * stream with `.on('error', () => {});`
 */
const getNetworkResolver = ({
  command,
  codebook,
} = {}) =>
  network =>
    new Promise((resolve) => { // TODO: is there any need for this to be a promise?
      const formatter = new AttributeListFormatter(network, false, false, codebook);
      const resolver = commandRunner(command);

      const pipeline = miss.pipeline(
        resolver,
        split(),
        csvToJson(),
        appendNodeNetworkData(network),
      );

      resolve(pipeline);

      formatter.writeToStream(resolver);
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

  getResolutions(protocolId) {
    return this.resolverDB.getResolutions(protocolId);
  }

  saveResolutions(protocolId, resolverPath, resolverParams, resolutions) {
    return this.resolverDB.insertResolutions(protocolId, resolverPath, resolverParams, resolutions);
  }

  resolveProtocol(
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
    const networkResolver = getNetworkResolver({ useEgoData, command, codebook });

    return this.getNetwork(protocol, { useEgoData })
      .then(networkResolver);
  }
}

module.exports = ResolverManager;
