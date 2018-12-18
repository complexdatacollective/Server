/* eslint-disable no-console */

const fs = require('fs');

const { buildMockData, variableRegistry } = require('./db-size');
const {
  AdjacencyMatrixFormatter,
  AttributeListFormatter,
  GraphMLFormatter,
  EdgeListFormatter,
} = require('../src/main/utils/formatters');

const mockdata = buildMockData({ sessionCount: 1 });
const merged = { nodes: [], edges: [] };

mockdata.forEach((session) => {
  merged.nodes.push(...session.data.nodes);
  merged.edges.push(...session.data.edges);
});

const write = async (formatter, outFile) => new Promise((resolve, reject) => {
  const writeStream = fs.createWriteStream(outFile);
  writeStream.on('finish', () => { resolve(); });
  writeStream.on('error', (err) => { reject(err); });
  formatter.writeToStream(writeStream);
});

(async () => {
  let formatter;

  console.time('graphml');
  formatter = new GraphMLFormatter(merged, false, variableRegistry);
  await write(formatter, 'test-export-xml.graphml');
  console.timeEnd('graphml');

  console.time('attr-list-csv');
  formatter = new AttributeListFormatter(merged);
  await write(formatter, 'test-export-attrs.csv');
  console.timeEnd('attr-list-csv');

  console.time('edge-list');
  formatter = new EdgeListFormatter(merged);
  await write(formatter, 'test-export-edge.csv');
  console.timeEnd('edge-list');

  console.time('matrix');
  formatter = new AdjacencyMatrixFormatter(merged);
  await write(formatter, 'test-export-matrix.csv');
  console.timeEnd('matrix');
})();
