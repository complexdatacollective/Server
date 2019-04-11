/* eslint-env jest */
const {
  filterNetworkEntities,
  filterNetworksWithQuery,
  getEntityAttributes,
  nodeAttributesProperty,
  unionOfNetworks,
  insertEgoInNetworks,
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

    it('joins egos of two networks', () => {
      const a = { nodes: [], edges: [], ego: { id: 1 } };
      const b = { nodes: [], edges: [], ego: { id: 2 } };
      expect(unionOfNetworks([a, b]).ego).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('insertEgoInNetworks', () => {
    it('inserts ego uid in node objects', () => {
      const a = { nodes: [{ id: 1 }, { id: 2 }], edges: [], ego: { _uid: 1 } };
      const b = { nodes: [{ id: a }], edges: [], ego: { _uid: 2 } };
      const egoNetworks = insertEgoInNetworks([a, b]);
      expect(egoNetworks[0].nodes).toEqual([{ _egoID: 1, id: 1 }, { _egoID: 1, id: 2 }]);
      expect(egoNetworks[1].nodes).toEqual([{ _egoID: 2, id: a }]);
    });

    it('inserts ego uid in edge objects', () => {
      const a = { nodes: [], edges: [{ id: 1 }, { id: 2 }], ego: { _uid: 1 } };
      const b = { nodes: [], edges: [{ id: a }], ego: { _uid: 2 } };
      const egoNetworks = insertEgoInNetworks([a, b]);
      expect(egoNetworks[0].edges).toEqual([{ _egoID: 1, id: 1 }, { _egoID: 1, id: 2 }]);
      expect(egoNetworks[1].edges).toEqual([{ _egoID: 2, id: a }]);
    });

    it('inserts session variables in ego', () => {
      const a = { nodes: [], edges: [], ego: { _uid: 1 }, sessionVariables: { _caseID: 'c' } };
      const b = { nodes: [], edges: [], ego: { _uid: 2 }, sessionVariables: { _caseID: 1 } };
      const egoNetworks = insertEgoInNetworks([a, b]);
      expect(egoNetworks[0].ego).toEqual({ _uid: 1, _caseID: 'c' });
      expect(egoNetworks[1].ego).toEqual({ _uid: 2, _caseID: 1 });
    });
  });

  describe('getEntityAttributes', () => {
    it('gets nested attributes', () => {
      const node = { id: 1, [nodeAttributesProperty]: { attr: 1 } };
      expect(getEntityAttributes(node)).toEqual({ attr: 1 });
    });
  });
});
