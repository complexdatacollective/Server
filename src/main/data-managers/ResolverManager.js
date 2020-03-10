/* eslint-disable no-underscore-dangle */

const path = require('path');
const split = require('split');
const miss = require('mississippi');
const { DateTime } = require('luxon');
const { get, find, findIndex, reduce } = require('lodash');
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
  (network) => {
    const formatter = new AttributeListFormatter(network, false, false, codebook);

    return commandRunner(command)
      .then((resolver) => {
        const pipeline = miss.pipeline(
          resolver(),
          split(),
          csvToJson(),
          appendNodeNetworkData(network),
        );

        formatter.writeToStream(pipeline);
        return pipeline;
      });
  };

const formatResolution = resolution => ({
  ...resolution,
  id: resolution._id,
});

const formatSession = (session) => {
  const id = session && session._id;
  const caseID = session && session.data && session.data.sessionVariables &&
    session.data.sessionVariables._caseID;
  return { ...session.data, _id: id, _caseID: caseID };
};

const getPriorResolutions = (resolutions, resolutionId) => {
  // from oldest to newest
  const sortedResolutions = [...resolutions]
    .sort((a, b) => DateTime.fromISO(a.date) - DateTime.fromISO(b.date));


  if (!resolutionId) { return sortedResolutions; }

  const lastResolution = findIndex(sortedResolutions, ['id', resolutionId]);

  if (lastResolution === -1) {
    throw new Error(`Resolution "${resolutionId}" could not be found`);
  }

  return sortedResolutions.slice(0, lastResolution + 1);
};

// 1. chunk sessions by resolutions
// Maybe resolutions should include references to included sessions rather than
// calculating it?
const getSessionsByResolution = (resolutions, sessions) =>
  sessions.reduce((memo, session) => {
    const sessionDate = DateTime.fromISO(session.date);

    const resolution = find(
      resolutions,
      ({ date }) =>
        sessionDate < DateTime.fromISO(date),
    );

    const resolutionId = (resolution && resolution.id) || '_unresolved';

    const group = get(memo, [resolutionId], []);

    return {
      ...memo,
      [resolutionId]: [...group, session],
    };
  }, {});

// TODO: make sure this still contains _egoID for 'new' nodes
const applyTransform = (network, transform) => {
  const withTransformNodesRemoved = network.nodes.filter(
    node => !transform.nodes.includes(node[nodePrimaryKeyProperty]),
  );

  // nodes weren't found return original network
  if (withTransformNodesRemoved.length !== network.nodes.length - transform.nodes.length) {
    return network;
  }

  const nodes = withTransformNodesRemoved.concat([{
    [nodePrimaryKeyProperty]: transform.id,
    [nodeAttributesProperty]: transform.attributes,
  }]);

  const edges = network.edges.map(edge => ({
    ...edge,
    from: transform.nodes.includes(edge.from) ? transform.id : edge.from,
    to: transform.nodes.includes(edge.to) ? transform.id : edge.to,
  }));

  return {
    ...network,
    nodes,
    edges,
  };
};

const transformSessions = (sessions, resolutions, { useEgoData, fromResolution }) => {
  const priorResolutions = getPriorResolutions(resolutions, fromResolution);
  const sessionsByResolution = getSessionsByResolution(priorResolutions, sessions);

  // For each resolution merge sessions and apply resolution
  const resultNetwork = reduce(
    priorResolutions,
    (accNetwork, resolution) => {
      const sessionNetworks = sessionsByResolution[resolution.id]; // array of networks

      if (!sessionNetworks) {
        // if no new sessions, operate on existing
        return resolution.transforms.reduce(applyTransform, accNetwork);
      }

      const withEgoData = useEgoData ? insertEgoInNetworks(sessionNetworks) : sessionNetworks;
      const unifiedNetwork = unionOfNetworks([accNetwork, ...withEgoData]);

      return resolution.transforms.reduce(applyTransform, unifiedNetwork);
    },
    { nodes: [], edges: [], ego: [] },
  );

  if (sessionsByResolution._unresolved) {
    return unionOfNetworks([resultNetwork, ...sessionsByResolution._unresolved]);
  }

  return resultNetwork;
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
    { useEgoData, entityResolutionOptions } = {},
  ) {
    const {
      enableEntityResolution,
      resolutionId,
    } = entityResolutionOptions;

    const protocolId = protocol._id;

    if (!enableEntityResolution) {
      return this.getSessions(protocolId)
        .then(networks => (useEgoData ? insertEgoInNetworks(networks) : networks))
        .then(networks => unionOfNetworks(networks));
    }

    const transformOptions = { useEgoData, resolutionId };

    return Promise.all([
      this.getSessions(protocolId),
      this.getResolutions(protocolId),
    ])
      .then(
        ([sessions, resolutions]) =>
          transformSessions(sessions, resolutions, transformOptions),
      );
  }

  getSessions(protocolId) {
    return this.sessionDB.findAll(protocolId, null, null)
      .then(sessions => sessions.map(formatSession));
  }

  getResolutions(protocolId) {
    return this.resolverDB.getResolutions(protocolId)
      .then(resolutions => resolutions.map(formatResolution));
  }

  saveResolution(protocolId, options, transforms) {
    return this.resolverDB.insertResolution(protocolId, options, transforms);
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

module.exports = {
  getPriorResolutions,
  getSessionsByResolution,
  applyTransform,
  transformSessions,
  ResolverManager,
  default: ResolverManager,
};
