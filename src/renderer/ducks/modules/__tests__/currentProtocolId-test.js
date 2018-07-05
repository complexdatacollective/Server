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
      const state = reducer(null, mockAction);
      expect(state).toEqual(mockId);
    });

    it('unsets if current is deleted', () => {
      const action = { type: 'PROTOCOL_DELETED', id: mockId };
      expect(reducer(mockId, action)).toEqual(null);
    });

    it('ignores if another is deleted', () => {
      const action = { type: 'PROTOCOL_DELETED', id: '' };
      expect(reducer(mockId, action)).toEqual(mockId);
    });
  });

  describe('setCurrentProtocol', () => {
    it('exports an async "load" action', () => {
      expect(actionCreators.setCurrentProtocol(mockId)).toEqual(mockAction);
    });
  });
});
