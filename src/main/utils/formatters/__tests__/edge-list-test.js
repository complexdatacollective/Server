/* eslint-env jest */
import { makeWriteableStream } from '../../../../../config/jest/setupTestEnv';
import { asEdgeList, toCSVStream } from '../edge-list';

const listFromEdges = (edges, directed) => asEdgeList({ edges }, directed);

describe('asEdgeList', () => {
  it('takes a network as input', () => {
    const network = { nodes: [], edges: [{ from: 'nodeA', to: 'nodeB' }] };
    expect(asEdgeList(network)).toHaveProperty('nodeA');
  });

  it('represents an edgeless network', () => {
    expect(listFromEdges([])).toEqual({});
  });

  it('represents a single undirected edge', () => {
    expect(
      listFromEdges([{ from: 1, to: 2 }])).toEqual({ 1: new Set([2]), 2: new Set([1]) },
    );
  });

  it('represents a single directed edge', () => {
    expect(listFromEdges([{ from: 1, to: 2 }], true)).toEqual({ 1: new Set([2]) });
  });
});

describe('toCSVStream', () => {
  let writable;

  beforeEach(() => {
    writable = makeWriteableStream();
  });

  it('Writes a simple csv', async () => {
    const list = listFromEdges([{ from: 1, to: 2 }]);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('1,2\r\n2,1\r\n');
  });

  it('Writes multiple edges', async () => {
    const list = listFromEdges([{ from: 1, to: 2 }, { from: 1, to: 3 }]);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('1,2\r\n1,3\r\n2,1\r\n3,1\r\n');
  });

  it('Writes a csv for directed edges', async () => {
    const list = listFromEdges([{ from: 1, to: 2 }, { from: 1, to: 3 }], true);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('1,2\r\n1,3\r\n');
  });

  it('Writes a csv for directed edges (inverse)', async () => {
    const list = listFromEdges([{ from: 1, to: 2 }, { from: 3, to: 1 }], true);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('1,2\r\n3,1\r\n');
  });

  it('Ignores duplicate edges', async () => {
    const list = listFromEdges([{ from: 1, to: 2 }, { from: 1, to: 2 }]);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('1,2\r\n2,1\r\n');
  });
});
