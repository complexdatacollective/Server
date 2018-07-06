import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';

const LOAD_PROTOCOLS = 'LOAD_PROTOCOLS';
const PROTOCOLS_LOADED = 'PROTOCOLS_LOADED';
const DELETE_PROTOCOL = 'DELETE_PROTOCOL';
const PROTOCOL_DELETED = 'PROTOCOL_DELETED';

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
    case PROTOCOLS_LOADED:
      return action.protocols.map(viewModelMapper);
    case LOAD_PROTOCOLS:
      return state;
    case DELETE_PROTOCOL:
      return state;
    case PROTOCOL_DELETED:
      return state.filter(protocol => protocol.id !== action.id);
    default:
      return state;
  }
};

const currentProtocol = (state, props) => {
  const protocols = state.protocols;
  const id = props.match && props.match.params.id;
  return protocols && id && protocols.find(p => p.id === id);
};

const protocolsHaveLoaded = state => state.protocols !== initialState;

const loadProtocolsDispatch = () => ({
  type: LOAD_PROTOCOLS,
});

const protocolsLoadedDispatch = protocols => ({
  type: PROTOCOLS_LOADED,
  protocols: protocols || [],
});

const deleteProtocolDispatch = id => ({
  type: DELETE_PROTOCOL,
  id,
});

const protocolDeletedDispatch = id => ({
  type: PROTOCOL_DELETED,
  id,
});

const loadProtocols = () => (dispatch) => {
  dispatch(loadProtocolsDispatch());
  getApiClient().get('/protocols')
    .then(resp => resp.protocols)
    .then(protocols => dispatch(protocolsLoadedDispatch(protocols)));
};

const deleteProtocol = id => (dispatch) => {
  dispatch(deleteProtocolDispatch(id));
  getApiClient().delete(`/protocols/${id}`)
    .then(() => dispatch(protocolDeletedDispatch(id)));
};

const actionCreators = {
  deleteProtocol,
  loadProtocols,
};

const actionTypes = {
  LOAD_PROTOCOLS,
  PROTOCOLS_LOADED,
  DELETE_PROTOCOL,
  PROTOCOL_DELETED,
};

const selectors = {
  currentProtocol,
  protocolsHaveLoaded,
};

export {
  actionCreators,
  actionTypes,
  selectors,
};

export default reducer;
