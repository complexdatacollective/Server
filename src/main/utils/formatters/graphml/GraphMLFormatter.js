const { Readable } = require('stream');

const { graphMLGenerator } = require('./createGraphML');

class GraphMLFormatter {
  constructor(data, useDirectedEdges, _, codebook) {
    this.network = data;
    this.codebook = codebook;
    this.useDirectedEdges = useDirectedEdges;
  }
  writeToStream(outStream) {
    const generator = graphMLGenerator(
      this.network,
      this.codebook,
      this.useDirectedEdges,
    );
    const inStream = new Readable({
      read(/* size */) {
        const { done, value } = generator.next();
        if (done) {
          this.push(null);
        } else {
          this.push(value);
        }
      },
    });

    // TODO: handle teardown. Use pipeline() API in Node 10?
    inStream.pipe(outStream);

    return {
      abort: () => { inStream.destroy(); },
    };
  }
}

module.exports = GraphMLFormatter;
