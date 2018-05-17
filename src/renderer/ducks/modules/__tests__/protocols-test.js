/* eslint-env jest */
import reducer, { actionCreators, actionTypes } from '../protocols';
import AdminApiClient from '../../../utils/adminApiClient';

jest.mock('../../../utils/adminApiClient');

describe('the protocols module', () => {
  describe('reducer', () => {
    it('has empty state by default', () => {
      expect(reducer(undefined)).toEqual([]);
    });

    it('is unchanged when loading', () => {
      const state = reducer(undefined, { type: actionTypes.LOAD_PROTOCOLS });
      expect(state).toEqual([]);
    });

    it('populates protocols', () => {
      const mockProtocols = [{ a: 1 }];
      const state = reducer(undefined, {
        type: actionTypes.PROTOCOLS_LOADED,
        protocols: mockProtocols,
      });
      expect(state).toEqual(mockProtocols);
    });

    describe('loadProtocols', () => {
      const dispatcher = jest.fn();
      const mockApiClient = new AdminApiClient();

      it('exports an async "load" action', () => {
        actionCreators.loadProtocols()(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith({ type: actionTypes.LOAD_PROTOCOLS });
        expect(mockApiClient.get).toHaveBeenCalled();
      });
    });
  });
});
