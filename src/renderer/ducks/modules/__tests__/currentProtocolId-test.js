/* eslint-env jest */
import reducer, { actionCreators, actionTypes } from '../currentProtocolId';

jest.mock('../../../utils/adminApiClient');

describe('the protocol module', () => {
  const mockId = 'mock-id';
  const mockAction = {
    type: actionTypes.SET_CURRENT_PROTOCOL,
    id: mockId,
  };

  describe('reducer', () => {
    it('has null state by default', () => {
      expect(reducer(undefined)).toEqual(null);
    });

    it('sets the current protocol ID', () => {
      const state = reducer(undefined, mockAction);
      expect(state).toEqual(mockId);
    });
  });

  describe('setCurrentProtocol', () => {
    it('exports an async "load" action', () => {
      expect(actionCreators.setCurrentProtocol(mockId)).toEqual(mockAction);
    });
  });
});
