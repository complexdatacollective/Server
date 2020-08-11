/* eslint-disable no-underscore-dangle */

const split = require('split');
const miss = require('mississippi');
const { has } = require('lodash');
const { sampleStream, countStream } = require('./streams/helpers');
const nodesToTable = require('./streams/nodesToTable');
const csvToJson = require('./streams/csvToJson');
const tableToCsv = require('./streams/tableToCsv');
const { nodePrimaryKeyProperty } = require('./formatters/network');
const commandRunner = require('./commandRunner');

const getNode = (nodes, id) => {
  const node = nodes.find(n => id === n[nodePrimaryKeyProperty]);

  if (!node) {
    throw new Error(
      `getNetworkResolver: Corresponding node data for '${id}' (convertUuidToDecimal) could not be found in network object.`,
    );
  }

  return node;
};

/**
 * Given a match which contains ids and a probability, append
 * network data for that node and parse the probabily as a float.
 *
 * { networkCanvasAlterID_1, networkCanvasAlterID_2, prob: '0.0' } ->
 *   { nodes: [ { id, attributes }, { id, attributes } ], prob: 0.0 }
 */
const appendNodeNetworkData = nodes =>
  miss.through((chunk, encoding, callback) => {
    try {
      const obj = JSON.parse(chunk);

      if (
        !has(obj, 'networkCanvasAlterID_1') ||
        !has(obj, 'networkCanvasAlterID_2') ||
        !has(obj, 'prob')
      ) {
        throw new Error('getNetworkResolver: Data must contain variables: networkCanvasAlterID_1, networkCanvasAlterID_2, prob');
      }

      const pair = [
        getNode(nodes, obj.networkCanvasAlterID_1),
        getNode(nodes, obj.networkCanvasAlterID_2),
      ];

      const probability = parseFloat(obj.prob);

      const result = {
        nodes: pair,
        probability,
      };

      const output = JSON.stringify(result);

      callback(null, output);
    } catch (err) {
      console.log({ err }); // eslint-disable-line
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
const getNetworkResolver = (
  command,
  { codebook },
) =>
  network =>
    commandRunner(command)
      .then((startResolver) => {
        const resolverProcess = startResolver();

        const pipeline = miss.pipeline(
          tableToCsv(),
          sampleStream('sent', 3),
          countStream('records sent'),
          resolverProcess,
          split(),
          csvToJson(),
          sampleStream('recieved', 3),
          countStream('records received'),
          appendNodeNetworkData(network.nodes),
        );

        pipeline.abort = () => {
          resolverProcess.kill();
        };

        nodesToTable(codebook, null, [...network.nodes]).pipe(pipeline);

        return pipeline;
      });

module.exports = {
  getNetworkResolver,
  default: getNetworkResolver,
};
