/* eslint-disable no-underscore-dangle */

const split = require('split');
const miss = require('mississippi');
const csvToJson = require('./streams/csvToJson');
const { convertUuidToDecimal, nodePrimaryKeyProperty, nodeAttributesProperty } = require('./formatters/network');
const commandRunner = require('./commandRunner');
const {
  AttributeListFormatter,
} = require('./formatters/index');

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
      `Corresponding node data for '${id}' (convertUuidToDecimal) could not be found in network object.`,
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

      const probability = parseFloat(obj.prob);

      const result = JSON.stringify({
        nodes,
        probability,
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
    // TODO: what happens when network is empty?
    const formatter = new AttributeListFormatter(network, false, false, codebook);

    return commandRunner(command)
      .then((resolverProcess) => {
        const pipeline = miss.pipeline(
          resolverProcess(),
          split(),
          csvToJson(),
          appendNodeNetworkData(network),
        );

        formatter.writeToStream(pipeline);
        return pipeline;
      });
  };

module.exports = {
  getNetworkResolver,
  default: getNetworkResolver,
};
