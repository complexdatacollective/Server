const logger = require('electron-log');

const AsyncReadable = require('./AsyncReadable');
const progressEvent = require('./progressEvent');
const { csvEOL } = require('./csv');

/**
 * Builds an edge list for a network, based only on its edges (it need
 * not contain all nodes). Each row contains two nodes; nodes in each column may be duplicated.
 *
 * Note that duplicate edges (e.g., of different types) are not conveyed in the output.
 *
 * @example
 * ```
 * | from | to   |
 * | a    | b    |
 * | a    | c    |
 * | b    | a    |
 * | c    | a    |
 * ```
 *
 * @param  {Object} network NC network containing edges
 * @param  {Array} network.edges
 * @param  {Boolean} directed if false, adjacencies are represented in both directions
 *                            default: false
 * @return {Object.<string, Set>} the adjacency list
 */
const asEdgeList = (network, directed = false) =>
  (network.edges || []).reduce((acc, val) => {
    acc[val.from] = acc[val.from] || new Set();
    acc[val.from].add(val.to);
    if (directed === false) {
      acc[val.to] = acc[val.to] || new Set();
      acc[val.to].add(val.from);
    }
    return acc;
  }, {});

/**
 * Write a CSV reprensentation of the list to the given Writable stream.
 *
 * @example
 * ```
 * a,b
 * a,c
 * b,a
 * c,a
 * ```
 *
 * @return {Object} an abort controller; call the attached abort() method as needed.
 */
// TODO: quoting/escaping (not needed while we're only using UUIDs)
const toCSVStream = (edgeList, outStream) => {
  const adjacencies = Object.entries(edgeList);
  const totalChunks = adjacencies.length;
  let chunkContent;
  let chunkIndex = 0;

  const inStream = new AsyncReadable({
    read() {
      setTimeout(() => {
        if (chunkIndex < totalChunks) {
          const [fromId, destinations] = adjacencies[chunkIndex];
          chunkContent = [...destinations].map(toId => `${fromId},${toId}`).join(csvEOL);
          this.push(`${chunkContent}${csvEOL}`);
          chunkIndex += 1;
          outStream.emit(progressEvent, chunkIndex / totalChunks);
        } else {
          this.push(null);
          outStream.emit(progressEvent, 1);
        }
      }, 0);
    },
  });

  inStream.on('error', (err) => {
    logger.warn('Readable error', err.message);
    logger.debug(err);
  });

  // TODO: handle teardown. Use pipeline() API in Node 10?
  inStream.pipe(outStream);

  return {
    abort: () => { inStream.destroy(); },
  };
};

class EdgeListFormatter {
  constructor(data, directed = false) {
    this.list = asEdgeList(data, directed);
  }
  writeToStream(outStream) {
    toCSVStream(this.list, outStream);
  }
}

module.exports = {
  EdgeListFormatter,
  asEdgeList,
  toCSVStream,
};
