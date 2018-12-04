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
 * @param  {Array}  edges from the NC network
 * @param  {Boolean} directed if false, adjacencies are represented in both directions
 *                            default: false
 * @return {Object.<string, Set>} the adjacency list
 */
const asAdjacencyList = (edges, directed = false) =>
  edges.reduce((acc, val) => {
    acc[val.from] = acc[val.from] || new Set();
    acc[val.from].add(val.to);
    if (directed === false) {
      acc[val.to] = acc[val.to] || new Set();
      acc[val.to].add(val.from);
    }
    return acc;
  }, {});

// TODO: quoting/escaping (not needed while we're only using UUIDs)
const toCSVStream = (adjancencyList, outStream) => {
  const csvEOL = '\r\n';
  Object.entries(adjancencyList).forEach(([source, destinations]) => {
    const rowContent = `${source},${[...destinations].join(',')}${csvEOL}`;
    outStream.write(rowContent);
  });
  outStream.end();
};

module.exports = {
  asAdjacencyList,
  toCSVStream,
};
