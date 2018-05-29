/* eslint-env jest */
import reducer, { actionCreators, actionTypes } from '../devices';
import AdminApiClient from '../../../utils/adminApiClient';

jest.mock('../../../utils/adminApiClient');

describe('the devices module', () => {
  describe('reducer', () => {
    it('has empty state by default', () => {
      expect(reducer(undefined)).toEqual([]);
    });

    it('is unchanged when loading', () => {
      const state = reducer(undefined, { type: actionTypes.LOAD_DEVICES });
      expect(state).toEqual([]);
    });

    it('populates devices', () => {
      const mockDevices = [{ a: 1 }];
      const state = reducer(undefined, { type: actionTypes.DEVICES_LOADED, devices: mockDevices });
      expect(state).toEqual(mockDevices);
    });

    describe('loadDevices', () => {
      const dispatcher = jest.fn();
      const mockApiClient = new AdminApiClient();

      it('exports an async "load" action', () => {
        actionCreators.loadDevices()(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith({ type: actionTypes.LOAD_DEVICES });
        expect(mockApiClient.get).toHaveBeenCalled();
      });
    });
  });
});
