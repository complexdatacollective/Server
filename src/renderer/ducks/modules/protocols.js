import AdminApiClient from '../../utils/adminApiClient';
import viewModelMapper from '../../utils/baseViewModelMapper';
import { actionCreators as dialogActions } from './dialogs';

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
      return state.filter((protocol) => protocol.id !== action.id);
    default:
      return state;
  }
};

// Select the current protocol based either on a `protocolId` prop or 'id' in the routing params
// May return undefined
const currentProtocol = (state, props) => {
  const { protocols } = state;
  const id = props.protocolId || (props.match && props.match.params.id);
  return protocols && id && protocols.find((p) => p.id === id);
};

// Return the ID of the current protocol, only if it exists.
const currentProtocolId = (state, props) => {
  const protocol = currentProtocol(state, props);
  return protocol && protocol.id;
};

const currentCodebook = (state, props) => {
  const protocol = currentProtocol(state, props);
  if (!protocol) {
    return {};
  }

  return protocol.codebook || {};
};

const nodeDefinitions = (state, protocolId) => {
  const protocol = currentProtocol(state, { protocolId });
  if (!protocol) { return []; }

  return protocol.codebook.node || {};
};

const distributionVariableTypes = ['ordinal', 'categorical'];
const isDistributionVariable = (variable) => distributionVariableTypes.includes(variable.type);

const getDistributionVariableNames = (variables) => (
  Object.entries(variables || {}).reduce((arr, [variableName, variable]) => {
    if (isDistributionVariable(variable)) {
      arr.push(variableName);
    }
    return arr;
  }, [])
);

const ordinalAndCategoricalVariablesByEntity = (entities) => {
  if ((entities || {}).name === 'ego') {
    const variableNames = getDistributionVariableNames(entities.variables);
    if (variableNames.length) {
      return { ego: variableNames };
    }
    return {};
  }

  return Object.entries(entities || {}).reduce((acc, [entityType, { variables }]) => {
    const variableNames = getDistributionVariableNames(variables);
    if (variableNames.length) {
      acc[entityType] = variableNames;
    }
    return acc;
  }, {});
};

/**
 * @return {Object} all node ordinal & categorical variable names, sectioned by node type
 */
const ordinalAndCategoricalVariables = (state, props) => {
  const codebook = currentCodebook(state, props);
  if (!codebook) {
    return {};
  }

  return {
    nodes: ordinalAndCategoricalVariablesByEntity(codebook.node),
    edges: ordinalAndCategoricalVariablesByEntity(codebook.edge),
    ego: ordinalAndCategoricalVariablesByEntity({ ...codebook.ego, name: 'ego' }),
  };
};

const protocolsHaveLoaded = (state) => state.protocols !== initialState;

const loadProtocolsDispatch = () => ({
  type: LOAD_PROTOCOLS,
});

const protocolsLoadedDispatch = (protocols) => ({
  type: PROTOCOLS_LOADED,
  protocols: protocols || [],
});

const deleteProtocolDispatch = (id) => ({
  type: DELETE_PROTOCOL,
  id,
});

const protocolDeletedDispatch = (id) => ({
  type: PROTOCOL_DELETED,
  id,
});

const loadProtocols = () => (dispatch) => {
  dispatch(loadProtocolsDispatch());
  return getApiClient().get('/protocols')
    .then((resp) => resp.protocols)
    .then((protocols) => dispatch(protocolsLoadedDispatch(protocols)))
    .catch((err) => {
      dispatch(dialogActions.openDialog({
        type: 'Error',
        title: 'Error Loading Protocols',
        error: err,
      }));
    });
};

const deleteProtocol = (id) => (dispatch) => {
  dispatch(deleteProtocolDispatch(id));
  return getApiClient().delete(`/protocols/${id}`)
    .then(() => dispatch(protocolDeletedDispatch(id)))
    .catch((err) => {
      dispatch(dialogActions.openDialog({
        type: 'Error',
        title: 'Error Deleting Protocol',
        error: err,
      }));
    });
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
  currentProtocolId,
  currentCodebook,
  isDistributionVariable,
  protocolsHaveLoaded,
  ordinalAndCategoricalVariables,
  nodeDefinitions,
};

export {
  actionCreators,
  actionTypes,
  selectors,
};

export default reducer;
