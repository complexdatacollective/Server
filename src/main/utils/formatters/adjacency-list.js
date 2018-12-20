// Need not contain all nodes
// TODO: I'm assuming only one edge per vertex pair; others are filtered out...
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

module.exports = {
  asAdjacencyList,
};
