/* eslint-env jest */
import { asAdjacencyList } from '../adjacency-list';

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
