/* eslint-disable no-console */

const fs = require('fs');
const { buildMockData } = require('./db-size');
const { asAdjacencyMatrix } = require('../src/main/utils/formatters/matrix');
const { asAdjacencyList, toCSVStream } = require('../src/main/utils/formatters/adjacency-list');
const { toCSVStream: toAttributeCSV } = require('../src/main/utils/formatters/attribute-list');


const mockdata = buildMockData({ sessionCount: 4500 });
const merged = { nodes: [], edges: [] };

mockdata.forEach((session) => {
  merged.nodes.push(...session.data.nodes);
  merged.edges.push(...session.data.edges);
});

console.time('attr-list-csv');
toAttributeCSV(merged.nodes, fs.createWriteStream('test-export-attrs.csv'));
console.timeEnd('attr-list-csv');

console.time('adjacency-list');
const list = asAdjacencyList(merged.edges, false);
console.timeEnd('adjacency-list');

console.time('adjacency-list-csv');
toCSVStream(list, fs.createWriteStream('test-export-list.csv'));
console.timeEnd('adjacency-list-csv');

console.time('list-directed');
asAdjacencyList(merged.edges, true);
console.timeEnd('list-directed');

console.time('matrix');
asAdjacencyMatrix(merged, false);
console.timeEnd('matrix');

console.time('matrix-directed');
const matrix = asAdjacencyMatrix(merged, true);
console.timeEnd('matrix-directed');

console.time('matrix-csv');
matrix.toCSVStream(fs.createWriteStream('test-export-matrix.csv'));
console.timeEnd('matrix-csv');
