import logger from 'electron-log';

import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';

const LOAD_PROTOCOL = 'LOAD_PROTOCOL';
const PROTOCOL_LOADED = 'PROTOCOL_LOADED';

const initialState = null;

const apiClient = new AdminApiClient();

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case PROTOCOL_LOADED:
      return action.protocol && viewModelMapper(action.protocol);
    case LOAD_PROTOCOL:
      return state;
    default:
      return state;
  }
};

const loadProtocolDispatch = () => ({
  type: LOAD_PROTOCOL,
});

const protocolLoadedDispatch = protocol => ({
  type: PROTOCOL_LOADED,
  protocol,
});

const loadProtocol = id => (dispatch) => {
  dispatch(loadProtocolDispatch());
  apiClient.get(`/protocols/${id}`)
    .then(resp => resp.protocol)
    .then(protocol => dispatch(protocolLoadedDispatch(protocol)))
    .catch((err) => {
      // Log & bubble up to let UI handle as needed
      logger.error(err);
      throw err;
    });
};

const actionCreators = {
  loadProtocol,
};

const actionTypes = {
  LOAD_PROTOCOL,
  PROTOCOL_LOADED,
};

export {
  actionCreators,
  actionTypes,
};

export default reducer;
