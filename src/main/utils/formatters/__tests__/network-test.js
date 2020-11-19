/* eslint-env jest */
const { entityPrimaryKeyProperty, entityAttributesProperty, egoProperty, caseProperty } = require('../../network-exporters/src/utils/reservedAttributes');
const {
  filterNetworkEntities,
  filterNetworksWithQuery,
  getEntityAttributes,
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
        const a = { nodes: [{ type: 'person', [entityAttributesProperty]: { age: 20 } }], edges: [] };
        const b = { nodes: [{ type: 'person', [entityAttributesProperty]: { age: 20 } }], edges: [] };
        const c = { nodes: [{ type: 'person', [entityAttributesProperty]: { age: 21 } }], edges: [] };
        const networks = [a, b, c];
        expect(filterNetworksWithQuery(networks, ruleConfig)).toEqual([a, b]);
      });
    });

    describe('filterNetworkEntities()', () => {
      it('includes nodes matching attributes', () => {
        const alice = { type: 'person', [entityAttributesProperty]: { age: 20 } };
        const bob = { type: 'person', [entityAttributesProperty]: { age: 21 } };
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
      const a =
        { nodes: [{ id: 1 }, { id: 2 }], edges: [], ego: { [entityPrimaryKeyProperty]: 1 } };
      const b = { nodes: [{ id: a }], edges: [], ego: { [entityPrimaryKeyProperty]: 2 } };
      const egoNetworks = insertEgoInNetworks([a, b]);
      expect(egoNetworks[0].nodes).toEqual(
        [{ [egoProperty]: 1, id: 1 }, { [egoProperty]: 1, id: 2 }]);
      expect(egoNetworks[1].nodes).toEqual([{ [egoProperty]: 2, id: a }]);
    });

    it('inserts ego uid in edge objects', () => {
      const a =
        { nodes: [], edges: [{ id: 1 }, { id: 2 }], ego: { [entityPrimaryKeyProperty]: 1 } };
      const b = { nodes: [], edges: [{ id: a }], ego: { [entityPrimaryKeyProperty]: 2 } };
      const egoNetworks = insertEgoInNetworks([a, b]);
      expect(egoNetworks[0].edges).toEqual(
        [{ [egoProperty]: 1, id: 1 }, { [egoProperty]: 1, id: 2 }]);
      expect(egoNetworks[1].edges).toEqual([{ [egoProperty]: 2, id: a }]);
    });

    it('inserts session variables in ego', () => {
      const a = {
        nodes: [],
        edges: [],
        ego: { [entityPrimaryKeyProperty]: 1 },
        sessionVariables: { [caseProperty]: 'c' },
      };
      const b = {
        nodes: [],
        edges: [],
        ego: { [entityPrimaryKeyProperty]: 2 },
        sessionVariables: { [caseProperty]: 1 },
      };
      const egoNetworks = insertEgoInNetworks([a, b]);
      expect(egoNetworks[0].ego).toEqual({ [entityPrimaryKeyProperty]: 1, [caseProperty]: 'c' });
      expect(egoNetworks[1].ego).toEqual({ [entityPrimaryKeyProperty]: 2, [caseProperty]: 1 });
    });
  });

  describe('getEntityAttributes', () => {
    it('gets nested attributes', () => {
      const node = { id: 1, [entityAttributesProperty]: { attr: 1 } };
      expect(getEntityAttributes(node)).toEqual({ attr: 1 });
    });
  });
});
