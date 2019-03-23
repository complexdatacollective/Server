/* eslint-env jest */
import { makeWriteableStream } from '../../../../../config/jest/setupTestEnv';
import { asEdgeList, toCSVStream, EdgeListFormatter } from '../edge-list';

const listFromEdges = (edges, directed) => asEdgeList({ edges }, directed);

describe('asEdgeList', () => {
  it('takes a network as input', () => {
    const network = {
      nodes: [],
      edges: [{ _uid: 456, from: 'nodeA', to: 'nodeB', attributes: {} }],
      ego: { _uid: 123 },
    };
    expect(asEdgeList(network)[0]).toEqual(
      { _uid: 456, _source: 'nodeA', _target: 'nodeB', to: 'nodeB', from: 'nodeA', attributes: {} },
    );
  });

  it('represents an edgeless network', () => {
    expect(listFromEdges([])).toEqual([]);
  });

  it('represents a single undirected edge', () => {
    expect(listFromEdges([{ from: 1, to: 2 }])).toEqual([
      { _source: 1, _target: 2, from: 1, to: 2 },
      { _source: 2, _target: 1, from: 1, to: 2 },
    ]);
  });

  it('represents a single directed edge', () => {
    expect(listFromEdges([{ from: 1, to: 2 }], true)).toEqual([
      { _source: 1, _target: 2, from: 1, to: 2 },
    ]);
  });

  it('include egoID', () => {
    expect(listFromEdges([{ _egoID: 123, from: 1, to: 2 }], true)).toEqual([
      { _egoID: 123, _source: 1, _target: 2, from: 1, to: 2 },
    ]);
  });
});

describe('toCSVStream', () => {
  let writable;

  beforeEach(() => {
    writable = makeWriteableStream();
  });

  it('Writes a simple csv', async () => {
    const list = listFromEdges([{ _uid: 123, from: 1, to: 2 }]);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,_source,_target\r\n123,1,2\r\n123,2,1\r\n');
  });

  it('Writes multiple edges', async () => {
    const list = listFromEdges([{ from: 1, to: 2 }, { from: 1, to: 3 }]);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,_source,_target\r\n,1,2\r\n,2,1\r\n,1,3\r\n,3,1\r\n');
  });

  it('Writes a csv for directed edges', async () => {
    const list = listFromEdges([{ from: 1, to: 2 }, { from: 1, to: 3 }], true);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,_source,_target\r\n,1,2\r\n,1,3\r\n');
  });

  it('Writes a csv for directed edges (inverse)', async () => {
    const list = listFromEdges([{ from: 1, to: 2 }, { from: 3, to: 1 }], true);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,_source,_target\r\n,1,2\r\n,3,1\r\n');
  });

  it('Writes a csv with egoID', async () => {
    const list = listFromEdges(
      [{ _egoID: 123, from: 1, to: 2 }, { _egoID: 456, from: 3, to: 1 }],
      true,
    );
    toCSVStream(list, writable, true);
    const csv = await writable.asString();
    expect(csv).toEqual('_egoID,_uid,_source,_target\r\n123,,1,2\r\n456,,3,1\r\n');
  });

  it('Writes a csv with attributes', async () => {
    const list = listFromEdges([{ from: 1, to: 2, attributes: { a: 1 } }], true);
    toCSVStream(list, writable);
    const csv = await writable.asString();
    expect(csv).toEqual('_uid,_source,_target,a\r\n,1,2,1\r\n');
  });
});

describe('EdgeListFormatter', () => {
  let writable;

  beforeEach(() => {
    writable = makeWriteableStream();
  });

  it('writeToStream returns an abort controller', () => {
    const formatter = new EdgeListFormatter({});
    const controller = formatter.writeToStream(writable);
    expect(controller.abort).toBeInstanceOf(Function);
  });
});
