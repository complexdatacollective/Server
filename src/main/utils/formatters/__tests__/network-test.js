/* eslint-env jest */
const { getNodeAttributes, nodeAttributesProperty, unionOfNetworks } = require('../network');

describe('network format helpers', () => {
  describe('unionOfNetworks', () => {
    it('joins nodes of two networks', () => {
      const a = { nodes: [{ id: 1 }], edges: [] };
      const b = { nodes: [{ id: 2 }], edges: [] };
      expect(unionOfNetworks([a, b]).nodes).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('joins edges of two networks', () => {
      const a = { nodes: [], edges: [{ id: 1 }] };
      const b = { nodes: [], edges: [{ id: 2 }] };
      expect(unionOfNetworks([a, b]).edges).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('getNodeAttributes', () => {
    it('gets nested attributes', () => {
      const node = { id: 1, [nodeAttributesProperty]: { attr: 1 } };
      expect(getNodeAttributes(node)).toEqual({ attr: 1 });
    });
  });
});
