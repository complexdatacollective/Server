/* eslint-env jest */
import reducer, { actionCreators, actionTypes, selectors } from '../protocols';
import AdminApiClient from '../../../utils/adminApiClient';

jest.mock('../../../utils/adminApiClient');

describe('the protocols module', () => {
  const mockDeleteFn = jest.fn().mockResolvedValue({});
  const mockGetFn = jest.fn().mockResolvedValue({});

  AdminApiClient.mockImplementation(() => ({
    delete: mockDeleteFn,
    get: mockGetFn,
  }));

  describe('reducer', () => {
    let mockProtocols;

    beforeEach(() => {
      mockProtocols = [{ a: 1 }];
    });

    it('has null state by default', () => {
      expect(reducer(undefined)).toEqual(null);
    });

    it('is unchanged when loading', () => {
      const state = reducer(undefined, { type: actionTypes.LOAD_PROTOCOLS });
      expect(state).toEqual(null);
    });

    it('is array when done loading', () => {
      const state = reducer(undefined, {
        type: actionTypes.PROTOCOLS_LOADED,
        protocols: [],
      });
      expect(state).toEqual([]);
    });

    it('populates protocols', () => {
      const state = reducer(undefined, {
        type: actionTypes.PROTOCOLS_LOADED,
        protocols: mockProtocols,
      });
      expect(state).toEqual(mockProtocols);
    });

    it('is unchanged when delete begins', () => {
      const action = { type: actionTypes.DELETE_PROTOCOL };
      expect(reducer(mockProtocols, action)).toEqual(mockProtocols);
    });

    it('removes a deleted protocol', () => {
      const protocol = mockProtocols[0];
      const action = { type: actionTypes.PROTOCOL_DELETED, id: protocol.id };
      expect(reducer(mockProtocols, action)).not.toContain(protocol);
    });
  });

  describe('actions', () => {
    const dispatcher = jest.fn();
    const mockApiClient = new AdminApiClient();

    beforeEach(() => {
      dispatcher.mockClear();
    });

    describe('loadProtocols', () => {
      it('exports an async "load" action', () => {
        actionCreators.loadProtocols()(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith({ type: actionTypes.LOAD_PROTOCOLS });
        expect(mockGetFn).toHaveBeenCalled();
      });

      it('handles errors internally', async () => {
        const err = new Error('mock error');
        mockApiClient.get.mockRejectedValue(err);
        await actionCreators.loadProtocols()(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith(expect.objectContaining(err));
      });
    });

    describe('deleteProtocol', () => {
      it('exports an async "delete" action', () => {
        actionCreators.deleteProtocol('1')(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith({ type: actionTypes.DELETE_PROTOCOL, id: '1' });
        expect(mockDeleteFn).toHaveBeenCalled();
      });

      it('handles errors internally', async () => {
        const err = new Error('mock error');
        mockApiClient.delete.mockRejectedValue(err);
        await actionCreators.deleteProtocol('1')(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith(expect.objectContaining(err));
      });
    });
  });

  describe('selectors', () => {
    const {
      currentProtocol,
      isDistributionVariable,
      ordinalAndCategoricalVariables,
      protocolsHaveLoaded,
      currentCodebook,
    } = selectors;

    describe('currentProtocol', () => {
      it('returns the current protocol object', () => {
        const state = { protocols: [{ id: '1' }] };
        const props = { match: { params: { id: '1' } } };
        expect(currentProtocol(state, props)).toEqual(state.protocols[0]);
      });
    });

    describe('isDistributionVariable', () => {
      it('returns true for categorical variables', () => {
        expect(isDistributionVariable({ type: 'ordinal' })).toBe(true);
      });

      it('returns true for ordinal variables', () => {
        expect(isDistributionVariable({ type: 'categorical' })).toBe(true);
      });

      it('returns false by default', () => {
        expect(isDistributionVariable({})).toBe(false);
      });
    });

    describe('ordinalAndCategoricalVariables', () => {
      it('returns entity variable names sectioned by entity type', () => {
        const codebook = {
          node: { 'node-type-id': { name: 'person', variables: { 'var-id-1': { name: 'catVar', type: 'categorical' } } } },
          edge: { 'edge-type-id': { name: 'friend', variables: { 'var-id-2': { name: 'ordVar', type: 'ordinal' } } } },
          ego: { name: 'ego', variables: { 'var-id-3': { name: 'catVar', type: 'categorical' } } },
        };
        const state = { protocols: [{ id: '1', codebook }] };
        const props = { match: { params: { id: '1' } } };
        expect(ordinalAndCategoricalVariables(state, props)).toEqual({ nodes: { 'node-type-id': ['var-id-1'] }, edges: { 'edge-type-id': ['var-id-2'] }, ego: { ego: ['var-id-3'] } });
      });

      it('ignores sections without these variables', () => {
        const codebook = {
          node: { 'node-type-id': { name: 'venue', variables: { 'var-id-1': { name: 'intVar', type: 'number' } } } },
        };
        const state = { protocols: [{ id: '1', codebook }] };
        const props = { match: { params: { id: '1' } } };
        expect(ordinalAndCategoricalVariables(state, props)).not.toHaveProperty('venue');
      });

      it('returns an empty object if entity codebook unavailable', () => {
        const state = { protocols: [{ id: '1', codebook: {} }] };
        const props = { match: { params: { id: '1' } } };
        expect(ordinalAndCategoricalVariables(state, props)).toEqual(
          { nodes: {}, edges: {}, ego: {} });
      });

      it('returns an empty object if protocol unavailable', () => {
        expect(ordinalAndCategoricalVariables({}, {})).toEqual({ nodes: {}, edges: {}, ego: {} });
      });
    });

    describe('protocolsHaveLoaded', () => {
      it('indicates protocols have loaded', () => {
        expect(protocolsHaveLoaded({ protocols: null })).toBe(false);
        expect(protocolsHaveLoaded({ protocols: [{ id: '1' }] })).toBe(true);
      });
    });

    describe('currentCodebook', () => {
      it('returns a codebook', () => {
        const codebook = {
          node: { 'node-type-id': { name: 'person', variables: {} } },
          edge: { 'edge-type-id': { name: 'friend', variables: {} } },
          ego: { name: 'ego', variables: { 'var-id-1': { name: 'ordVar', type: 'ordinal' } } },
        };
        const state = { protocols: [{ id: '1', codebook }] };
        const props = { match: { params: { id: '1' } } };
        const codebook2 = currentCodebook(state, props);
        expect(codebook2).toHaveProperty('node');
        expect(codebook2.node).toHaveProperty('node-type-id');
        expect(codebook2).toHaveProperty('edge');
        expect(codebook2.edge).toHaveProperty('edge-type-id');
        expect(codebook2).toHaveProperty('ego');
        expect(codebook2.ego.variables).toHaveProperty('var-id-1');
      });

      it('does not require edge variables', () => {
        const codebook = {
          node: { 'node-type-id': { name: 'person', variables: {} } },
          edge: { 'edge-type-id': { name: 'edge-name' } },
        };
        const state = { protocols: [{ id: '1', codebook }] };
        const props = { match: { params: { id: '1' } } };
        const codebook2 = currentCodebook(state, props);
        expect(codebook2.edge).toEqual({ 'edge-type-id': { name: 'edge-name' } });
      });
    });
  });
});
