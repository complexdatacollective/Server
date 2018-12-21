const logger = require('electron-log');
const { Readable } = require('stream');

const progressEvent = require('../progressEvent');
const { estimatedChunkCount, graphMLGenerator } = require('./createGraphML');

class GraphMLFormatter {
  constructor(data, useDirectedEdges, variableRegistry) {
    this.network = data;
    this.variableRegistry = variableRegistry;
    this.useDirectedEdges = useDirectedEdges;
  }
  writeToStream(outStream) {
    const generator = graphMLGenerator(
      this.network,
      this.variableRegistry,
      this.useDirectedEdges,
    );
    let chunksRead = 0;
    const totalChunks = estimatedChunkCount(this.network);
    const inStream = new Readable({
      read(/* size */) {
        setTimeout(() => {
          const { done, value } = generator.next();
          if (done) {
            this.push(null);
            outStream.emit(progressEvent, 1);
          } else {
            this.push(value);
            chunksRead += 1;
            outStream.emit(progressEvent, chunksRead / totalChunks);
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
  }
}

module.exports = GraphMLFormatter;
