/* eslint-env jest */
import reducer, { actionCreators, actionTypes } from '../protocol';
import AdminApiClient from '../../../utils/adminApiClient';

jest.mock('../../../utils/adminApiClient');

describe('the protocol module', () => {
  describe('reducer', () => {
    it('has null state by default', () => {
      expect(reducer(undefined)).toEqual(null);
    });

    it('is unchanged when loading', () => {
      const state = reducer(undefined, { type: actionTypes.LOAD_PROTOCOL });
      expect(state).toEqual(null);
    });

    it('sets the current protocol', () => {
      const mockProtocol = { a: 1 };
      const state = reducer(undefined, {
        type: actionTypes.PROTOCOL_LOADED,
        protocol: mockProtocol,
      });
      expect(state).toEqual(mockProtocol);
    });

    describe('loadProtocol', () => {
      const dispatcher = jest.fn();
      const mockApiClient = new AdminApiClient();

      it('exports an async "load" action', () => {
        actionCreators.loadProtocol()(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith({ type: actionTypes.LOAD_PROTOCOL });
        expect(mockApiClient.get).toHaveBeenCalled();
      });
    });
  });
});
