/* eslint-env jest */
const {
  filterNetworkEntities,
  filterNetworksWithQuery,
  getNodeAttributes,
  nodeAttributesProperty,
  unionOfNetworks,
} = require('../network');

describe('network format helpers', () => {
  describe('filtering & querying', () => {
    const ruleConfig = {
      rules: [
        {
          type: 'alter',
          options: { type: 'person', operator: 'EXACTLY', attribute: 'age', value: 20 },
          assert: { operator: 'GREATER_THAN', value: 0 }, // for query only
        },
      ],
      join: 'OR',
    };

    describe('filterNetworksWithQuery()', () => {
      it('includes nodes from attribute query', () => {
        const a = { nodes: [{ type: 'person', [nodeAttributesProperty]: { age: 20 } }], edges: [] };
        const b = { nodes: [{ type: 'person', [nodeAttributesProperty]: { age: 20 } }], edges: [] };
        const c = { nodes: [{ type: 'person', [nodeAttributesProperty]: { age: 21 } }], edges: [] };
        const networks = [a, b, c];
        expect(filterNetworksWithQuery(networks, ruleConfig)).toEqual([a, b]);
      });
    });

    describe('filterNetworkEntities()', () => {
      it('includes nodes matching attributes', () => {
        const alice = { type: 'person', [nodeAttributesProperty]: { age: 20 } };
        const bob = { type: 'person', [nodeAttributesProperty]: { age: 21 } };
        const networks = [{ nodes: [alice, bob], edges: [] }];
        expect(filterNetworkEntities(networks, ruleConfig)[0].nodes).toEqual([alice]);
      });
    });
  });

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
