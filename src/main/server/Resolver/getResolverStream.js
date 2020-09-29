/* eslint-disable no-underscore-dangle */

const split = require('split'); // use each?
const miss = require('mississippi');
const commandRunner = require('./commandRunner');

/**
 * Because this is a 'pipeline' (https://github.com/maxogden/mississippi#pipeline)
 * if any of the streams emits an error, all the streams in the pipeline
 * will be closed automatically, and the error can be captured on the last
 * stream with `.on('error', () => {});`
 */
const getResolverStream = command =>
  commandRunner(command)
    .then((startResolver) => {
      const resolverProcess = startResolver();

      const resolverStream = miss.pipeline(
        resolverProcess,
        split(),
      );

      resolverStream.abort = () => {
        resolverStream.destroy();
        resolverProcess.kill();
      };

      return resolverStream;
    });

module.exports = getResolverStream;
