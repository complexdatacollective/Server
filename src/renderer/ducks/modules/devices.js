import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';
import { actionCreators as dialogActions } from './dialogs';

const LOAD_DEVICES = 'LOAD_DEVICES';
const DEVICES_LOADED = 'DEVICES_LOADED';
const DELETE_DEVICE = 'DELETE_DEVICE';

// Null state: Load has not completed
const initialState = null;

let sharedApiClient = null;
const getApiClient = () => {
  if (!sharedApiClient) {
    sharedApiClient = new AdminApiClient();
  }
  return sharedApiClient;
};

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case DEVICES_LOADED:
      return action.devices.map(viewModelMapper);
    case LOAD_DEVICES:
      return state;
    default:
      return state;
  }
};

const loadDevicesAction = () => ({
  type: LOAD_DEVICES,
});

const devicesLoadedAction = (devices) => ({
  type: DEVICES_LOADED,
  devices: devices || [],
});

const loadDevices = () => (dispatch) => {
  dispatch(loadDevicesAction());
  return getApiClient().get('/devices')
    .then((resp) => resp.devices)
    .then((devices) => dispatch(devicesLoadedAction(devices)))
    .catch((err) => {
      dispatch(dialogActions.openDialog({
        type: 'Error',
        title: 'Error Loading Devices',
        error: err,
      }));
    });
};

const deleteDeviceAction = (deviceId) => ({
  type: DELETE_DEVICE,
  deviceId,
});

const deleteDevice = (deviceId) => (dispatch) => {
  dispatch(deleteDeviceAction(deviceId));
  return getApiClient().delete(`devices/${deviceId}`)
    .then(() => loadDevices()(dispatch))
    .catch((err) => {
      dispatch(dialogActions.openDialog({
        type: 'Error',
        title: 'Error Deleting Device',
        error: err,
      }));
    });
};

const actionCreators = {
  loadDevices,
  deleteDevice,
};

const actionTypes = {
  LOAD_DEVICES,
  DEVICES_LOADED,
  DELETE_DEVICE,
};

export {
  actionCreators,
  actionTypes,
};

export default reducer;
