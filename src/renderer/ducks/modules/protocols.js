import logger from 'electron-log';

import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';

const LOAD_PROTOCOLS = 'LOAD_PROTOCOLS';
const PROTOCOLS_LOADED = 'PROTOCOLS_LOADED';

const initialState = [];

const apiClient = new AdminApiClient();

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case PROTOCOLS_LOADED:
      return action.protocols.map(viewModelMapper);
    case LOAD_PROTOCOLS:
      return state;
    default:
      return state;
  }
};

const loadProtocolsDispatch = () => ({
  type: LOAD_PROTOCOLS,
});

const protocolsLoadedDispatch = protocols => ({
  type: PROTOCOLS_LOADED,
  protocols,
});

const loadProtocols = () => (dispatch) => {
  dispatch(loadProtocolsDispatch());
  apiClient.get('/protocols')
    .then(resp => resp.protocols)
    .then(protocols => dispatch(protocolsLoadedDispatch(protocols)))
    .catch((err) => {
      // Log & bubble up to let UI handle as needed
      logger.error(err);
      throw err;
    });
};

const actionCreators = {
  loadProtocols,
};

const actionTypes = {
  LOAD_PROTOCOLS,
  PROTOCOLS_LOADED,
};

export {
  actionCreators,
  actionTypes,
};

export default reducer;
