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
        expect(dispatcher).toHaveBeenCalledWith(expect.objectContaining({ text: err.message }));
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
        expect(dispatcher).toHaveBeenCalledWith(expect.objectContaining({ text: err.message }));
      });
    });
  });

  describe('selectors', () => {
    const { currentProtocol, protocolsHaveLoaded, transposedRegistry } = selectors;

    describe('currentProtocol', () => {
      it('returns the current protocol object', () => {
        const state = { protocols: [{ id: '1' }] };
        const props = { match: { params: { id: '1' } } };
        expect(currentProtocol(state, props)).toEqual(state.protocols[0]);
      });
    });

    describe('protocolsHaveLoaded', () => {
      it('indicates protocols have loaded', () => {
        expect(protocolsHaveLoaded({ protocols: null })).toBe(false);
        expect(protocolsHaveLoaded({ protocols: [{ id: '1' }] })).toBe(true);
      });
    });

    describe('transposedRegistry', () => {
      it('returns a modified registry', () => {
        const variableRegistry = { node: { 'node-type-id': { name: 'person', variables: {} } } };
        const state = { protocols: [{ id: '1', variableRegistry }] };
        const props = { match: { params: { id: '1' } } };
        const transposed = transposedRegistry(state, props);
        expect(transposed).toHaveProperty('node');
        expect(transposed.node).toHaveProperty('person');
      });

      it('does not require edge variables', () => {
        const variableRegistry = { node: { 'node-type-id': { name: 'person', variables: {} } }, edge: { 'edge-type-id': {} } };
        const state = { protocols: [{ id: '1', variableRegistry }] };
        const props = { match: { params: { id: '1' } } };
        const transposed = transposedRegistry(state, props);
        expect(transposed.edge).toEqual({});
      });
    });
  });
});
