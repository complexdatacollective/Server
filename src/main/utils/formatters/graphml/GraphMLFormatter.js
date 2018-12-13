const { createGraphML } = require('./createGraphML');

class GraphMLFormatter {
  constructor(data, useDirectedEdges, variableRegistry) {
    this.network = data;
    this.variableRegistry = variableRegistry;
    this.useDirectedEdges = useDirectedEdges;
  }
  toString() {
    return createGraphML(this.network, this.variableRegistry, null, this.useDirectedEdges);
  }
}

module.exports = GraphMLFormatter;
