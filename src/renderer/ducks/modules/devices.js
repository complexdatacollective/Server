import logger from 'electron-log';

import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';

const LOAD_DEVICES = 'LOAD_DEVICES';
const DEVICES_LOADED = 'DEVICES_LOADED';

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

const loadDevicesDispatch = () => ({
  type: LOAD_DEVICES,
});

const devicesLoadedDispatch = devices => ({
  type: DEVICES_LOADED,
  devices: devices || [],
});

const loadDevices = () => (dispatch) => {
  dispatch(loadDevicesDispatch());
  getApiClient().get('/devices')
    .then(resp => resp.devices)
    .then(devices => dispatch(devicesLoadedDispatch(devices)))
    .catch((err) => {
      // Log & bubble up to let UI handle as needed
      logger.error(err);
      throw err;
    });
};

const actionCreators = {
  loadDevices,
};

const actionTypes = {
  LOAD_DEVICES,
  DEVICES_LOADED,
};

export {
  actionCreators,
  actionTypes,
};

export default reducer;
