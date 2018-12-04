/* eslint-env jest */
import { Writable } from 'stream';
import { asAdjacencyList, toCSVStream } from '../adjacency-list';

describe('asAdjacencyList', () => {
  it('represents an edgeless network', () => {
    expect(asAdjacencyList([])).toEqual({});
  });

  it('represents a single undirected edge', () => {
    expect(asAdjacencyList([{ from: 1, to: 2 }])).toEqual({ 1: new Set([2]), 2: new Set([1]) });
  });

  it('represents a single directed edge', () => {
    expect(asAdjacencyList([{ from: 1, to: 2 }], true)).toEqual({ 1: new Set([2]) });
  });
});

describe('toCSVStream', () => {
  let chunks;
  let streamToString;
  let writable;

  beforeEach(() => {
    chunks = [];
    streamToString = async stream => new Promise((resolve, reject) => {
      stream.on('finish', () => { resolve(chunks.join('')); });
      stream.on('error', (err) => { reject(err); });
    });
    writable = new Writable({
      write(chunk, encoding, next) {
        chunks.push(chunk.toString());
        next(null);
      },
    });
  });

  it('Writes a simple csv', async () => {
    const list = asAdjacencyList([{ from: 1, to: 2 }]);
    toCSVStream(list, writable);
    const csv = await streamToString(writable);
    expect(csv).toEqual('1,2\r\n2,1\r\n');
  });

  it('Writes multiple edges', async () => {
    const list = asAdjacencyList([{ from: 1, to: 2 }, { from: 1, to: 3 }]);
    toCSVStream(list, writable);
    const csv = await streamToString(writable);
    expect(csv).toEqual('1,2,3\r\n2,1\r\n3,1\r\n');
  });

  it('Writes a csv for directed edges', async () => {
    const list = asAdjacencyList([{ from: 1, to: 2 }, { from: 1, to: 3 }], true);
    toCSVStream(list, writable);
    const csv = await streamToString(writable);
    expect(csv).toEqual('1,2,3\r\n');
  });

  it('Writes a csv for directed edges (inverse)', async () => {
    const list = asAdjacencyList([{ from: 1, to: 2 }, { from: 3, to: 1 }], true);
    toCSVStream(list, writable);
    const csv = await streamToString(writable);
    expect(csv).toEqual('1,2\r\n3,1\r\n');
  });

  it('Ignores duplicate edges', async () => {
    const list = asAdjacencyList([{ from: 1, to: 2 }, { from: 1, to: 2 }]);
    toCSVStream(list, writable);
    const csv = await streamToString(writable);
    expect(csv).toEqual('1,2\r\n2,1\r\n');
  });
});
