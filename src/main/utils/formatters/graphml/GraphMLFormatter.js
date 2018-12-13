const { buildGraphML } = require('./createGraphML');

class GraphMLFormatter {
  constructor(data, useDirectedEdges, variableRegistry) {
    this.network = data;
    this.variableRegistry = variableRegistry;
    this.useDirectedEdges = useDirectedEdges;
  }
  toString() {
    const contents = buildGraphML(this.network, this.variableRegistry, this.useDirectedEdges);
    return contents.toString();
  }
}

module.exports = GraphMLFormatter;
