const { Readable } = require('stream');

const { csvEOL } = require('./csv');

/**
 * Builds an adjacency list for a network, based only on its edges (it need
 * not contain all nodes).
 *
 * Note that duplicate edges (e.g., of different types) are not conveyed in the output.
 *
 * @example:
 * ```
 * | node | adjacent |
 * | a    | b,c      |
 * | b    | a        |
 * | c    | a        |
 * ```
 *
 * @param  {Object} network NC network containing edges
 * @param  {Array} network.edges
 * @param  {Boolean} directed if false, adjacencies are represented in both directions
 *                            default: false
 * @return {Object.<string, Set>} the adjacency list
 */
const asAdjacencyList = (network, directed = false) =>
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
 * a,b,c
 * b,a
 * c,a
 * ```
 *
 * @return {Object} an abort controller; call the attached abort() method as needed.
 */
// TODO: quoting/escaping (not needed while we're only using UUIDs)
const toCSVStream = (adjancencyList, outStream) => {
  const adjacencies = Object.entries(adjancencyList);
  const totalRows = adjacencies.length;
  let rowContent;
  let rowIndex = 0;

  const inStream = new Readable({
    read(/* size */) {
      if (rowIndex < totalRows) {
        const [source, destinations] = adjacencies[rowIndex];
        rowContent = `${source},${[...destinations].join(',')}${csvEOL}`;
        this.push(rowContent);
        rowIndex += 1;
      } else {
        this.push(null);
      }
    },
  });

  // TODO: handle teardown. Use pipeline() API in Node 10?
  inStream.pipe(outStream);

  return {
    abort: () => { inStream.destroy(); },
  };
};

class AdjacencyListFormatter {
  constructor(data, directed = false) {
    this.list = asAdjacencyList(data, directed);
  }
  writeToStream(outStream) {
    toCSVStream(this.list, outStream);
  }
}

module.exports = {
  AdjacencyListFormatter,
  asAdjacencyList,
  toCSVStream,
};
