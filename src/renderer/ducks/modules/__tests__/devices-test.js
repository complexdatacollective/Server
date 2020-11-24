/* eslint-env jest */
import reducer, { actionCreators, actionTypes } from '../devices';
import AdminApiClient from '../../../utils/adminApiClient';

jest.mock('../../../utils/adminApiClient');

describe('the devices module', () => {
  describe('reducer', () => {
    it('has null state by default', () => {
      expect(reducer(undefined)).toEqual(null);
    });

    it('is unchanged when loading', () => {
      const state = reducer(undefined, { type: actionTypes.LOAD_DEVICES });
      expect(state).toEqual(null);
    });

    it('is array when done loading', () => {
      const state = reducer(undefined, { type: actionTypes.DEVICES_LOADED, devices: [] });
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

      beforeEach(() => {
        dispatcher.mockClear();
      });

      it('exports an async "load" action', async () => {
        await actionCreators.loadDevices()(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith({ type: actionTypes.LOAD_DEVICES });
        expect(mockApiClient.get).toHaveBeenCalled();
      });

      it('handles errors internally', async () => {
        const err = new Error('mock error');
        mockApiClient.get.mockRejectedValue(err);
        await actionCreators.loadDevices()(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith(expect.objectContaining(err));
      });
    });

    describe('deleteDevice', () => {
      const dispatcher = jest.fn();
      const mockApiClient = new AdminApiClient();

      beforeEach(() => {
        dispatcher.mockClear();
        mockApiClient.get.mockResolvedValue([]);
      });

      it('exports an async "delete" action', async () => {
        await actionCreators.deleteDevice('abc')(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith({ type: actionTypes.DELETE_DEVICE, deviceId: 'abc' });
        expect(mockApiClient.delete).toHaveBeenCalled();
      });

      it('reloads after delete', async () => {
        await actionCreators.deleteDevice('abc')(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith({ type: actionTypes.LOAD_DEVICES });
      });

      it('handles errors internally', async () => {
        const err = new Error('mock error');
        mockApiClient.get.mockRejectedValue(err);
        await actionCreators.deleteDevice('abc')(dispatcher);
        expect(dispatcher).toHaveBeenCalledWith(expect.objectContaining(err));
      });
    });
  });
});
