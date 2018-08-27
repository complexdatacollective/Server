/* eslint-env jest */
import reducer, { actionCreators, actionTypes, initialState } from '../connectionInfo';

const mockAction = {
  type: actionTypes.SET_CONNECTION_INFO,
  connectionInfo: { deviceService: {} },
};

describe('connectionInfo', () => {
  describe('reducer', () => {
    it('is null initially', () => {
      expect(initialState).toBe(null);
    });

    it('sets connection info', () => {
      expect(reducer(initialState, mockAction)).toEqual(mockAction.connectionInfo);
    });
  });

  describe('setConnectionInfo action', () => {
    it('returns connection info', () => {
      const action = actionCreators.setConnectionInfo(mockAction.connectionInfo);
      expect(action).toEqual(mockAction);
    });
  });
});
