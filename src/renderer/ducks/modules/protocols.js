import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';
import { actionCreators as messageActionCreators } from './appMessages';
import { transposedRegistrySection } from '../../../main/utils/formatters/network'; // TODO: move

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

// Transpose all types & variable IDs to names
// Imported data is transposed; this allows utility components from Architect to work as-is.
const transposedRegistry = (state, props) => {
  const protocol = currentProtocol(state, props);
  if (!protocol) {
    return null;
  }

  const registry = protocol.variableRegistry || {};
  return {
    edge: transposedRegistrySection(registry.edge),
    node: transposedRegistrySection(registry.node),
  };
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
  return getApiClient().get('/protocols')
    .then(resp => resp.protocols)
    .then(protocols => dispatch(protocolsLoadedDispatch(protocols)))
    .catch(err => messageActionCreators.showErrorMessage(err.message)(dispatch));
};

const deleteProtocol = id => (dispatch) => {
  dispatch(deleteProtocolDispatch(id));
  return getApiClient().delete(`/protocols/${id}`)
    .then(() => dispatch(protocolDeletedDispatch(id)))
    .catch(err => messageActionCreators.showErrorMessage(err.message)(dispatch));
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
  transposedRegistry,
};

export {
  actionCreators,
  actionTypes,
  selectors,
};

export default reducer;
