/* eslint-env jest */

const { GraphMLFormatter } = require('../index');
const { nodePrimaryKeyProperty } = require('../network');
const {
  formats,
  formatsAreValid,
  getFileExtension,
  getFormatterClass,
  partitionByEdgeType,
} = require('../utils');

describe('formatter utilities', () => {
  describe('getFileExtension', () => {
    it('maps CSV types', () => {
      expect(getFileExtension(formats.adjacencyMatrix)).toEqual('.csv');
      expect(getFileExtension(formats.edgeList)).toEqual('.csv');
      expect(getFileExtension(formats.attributeList)).toEqual('.csv');
      expect(getFileExtension(formats.ego)).toEqual('.csv');
    });
  });

  describe('getFormatterClass', () => {
    it('maps graphml to its formatter', () => {
      expect(getFormatterClass(formats.graphml)).toEqual(GraphMLFormatter);
    });

    it('maps each format to a class', () => {
      Object.keys(formats).forEach((format) => {
        expect(getFormatterClass(format)).toBeDefined();
      });
    });
  });

  describe('formatsAreValid', () => {
    it('recognizes formats', () => {
      expect(formatsAreValid(['graphml'])).toBe(true);
    });

    it('requires an array', () => {
      expect(formatsAreValid()).toBe(false);
    });

    it('checks for invalid formats', () => {
      expect(formatsAreValid(['graphml', 'not-a-format'])).toBe(false);
    });
  });

  describe('partitionByEdgeType', () => {
    const alice = { [nodePrimaryKeyProperty]: 'a' };
    const bob = { [nodePrimaryKeyProperty]: 'b' };
    const carla = { [nodePrimaryKeyProperty]: 'c' };
    let nodes;
    let network;
    beforeEach(() => {
      nodes = [alice, bob, carla];
      network = {
        nodes,
        edges: [{ from: 'a', to: 'b', type: 'knows' }, { from: 'a', to: 'b', type: 'likes' }],
      };
    });

    it('partitions edges for matrix output', () => {
      const partitioned = partitionByEdgeType(network, formats.adjacencyMatrix);
      expect(partitioned[0].edges).toEqual([network.edges[0]]);
      expect(partitioned[1].edges).toEqual([network.edges[1]]);
    });

    it('partitions edges for edge list output', () => {
      const partitioned = partitionByEdgeType(network, formats.edgeList);
      expect(partitioned[0].edges).toEqual([network.edges[0]]);
      expect(partitioned[1].edges).toEqual([network.edges[1]]);
    });

    it('does not partition for other types', () => {
      expect(partitionByEdgeType(network, formats.graphml)).toHaveLength(1);
      expect(partitionByEdgeType(network, formats.attributeList)).toHaveLength(1);
    });

    it('decorates with an edgeType prop', () => {
      const partitioned = partitionByEdgeType(network, formats.adjacencyMatrix);
      expect(partitioned[0].edgeType).toEqual('knows');
      expect(partitioned[1].edgeType).toEqual('likes');
    });

    it('maintains a reference to nodes (without copying or modifying)', () => {
      // This is important to keep memory use low on large networks
      const partitioned = partitionByEdgeType(network, formats.adjacencyMatrix);
      expect(partitioned[0].nodes).toBe(nodes);
      expect(partitioned[1].nodes).toBe(nodes);
    });

    it('returns at least 1 network, even when no edges', () => {
      const partitioned = partitionByEdgeType({ nodes, edges: [] }, formats.adjacencyMatrix);
      expect(partitioned).toHaveLength(1);
      expect(partitioned[0].nodes).toBe(nodes);
    });
  });
});
