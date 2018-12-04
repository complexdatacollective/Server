/* eslint-disable no-console */

const fs = require('fs');
const { buildMockData } = require('./db-size');
const { asAdjacencyMatrix } = require('../src/main/utils/formatters/matrix');
const { asAdjacencyList, toCSVStream } = require('../src/main/utils/formatters/adjacency-list');


const mockdata = buildMockData({ sessionCount: 4500 });
const merged = { nodes: [], edges: [] };

mockdata.forEach((session) => {
  merged.nodes.push(...session.data.nodes);
  merged.edges.push(...session.data.edges);
});

console.time('list');
const list = asAdjacencyList(merged.edges, false);
console.timeEnd('list');

console.time('list-csv');
toCSVStream(list, fs.createWriteStream('test-export-list.csv'));
console.timeEnd('list-csv');

console.time('list-directed');
asAdjacencyList(merged.edges, true);
console.timeEnd('list-directed');

console.time('matrix');
asAdjacencyMatrix(merged, false);
console.timeEnd('matrix');

console.time('matrix-directed');
const matrix = asAdjacencyMatrix(merged, true);
console.timeEnd('matrix-directed');

// Test CSV output
console.time('csv');
matrix.toCSVStream(fs.createWriteStream('test-export-matrix.csv'));
console.timeEnd('csv');
