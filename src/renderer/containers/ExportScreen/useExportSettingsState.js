import { useReducer } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';

const selectResolution = createAction('SELECT_RESOLUTION');
const selectCreateNewResolution = createAction('SELECT_CREATE_NEW_RESOLUTION');
const toggleSetting = createAction('TOGGLE_SETTING', (name, checked) => ({ name, checked }));
const updateSetting = createAction('UPDATE_SETTING', (name, value) => ({ name, value }));
const updateSettings = createAction('UPDATE_SETTINGS');
const csvTypeChange = createAction('CSV_TYPE_CHANGE', (type, checked) => ({ checked, type }));

export const actionCreators = {
  selectResolution,
  selectCreateNewResolution,
  toggleSetting,
  updateSetting,
  updateSettings,
  csvTypeChange,
};

export const availableCsvTypes = {
  adjacencyMatrix: 'Adjacency Matrix',
  attributeList: 'Attribute List',
  edgeList: 'Edge List',
};

const initialState = {
  exportFormat: 'csv',
  exportNetworkUnion: false,
  csvTypes: new Set([...Object.keys(availableCsvTypes), 'ego']),
  useDirectedEdges: true,
  useEgoData: true,
  enableEntityResolution: false,
  resolutionId: null,
  createNewResolution: false,
  egoCastType: undefined,
  // entityResolutionArguments: '',
  // entityResolutionPath: '',
  entityResolutionArguments: '--minimumThreshold=0.5',
  entityResolutionPath:
    '/Users/steve/Projects/northwestern/network-canvas-er/Random.py',
};

const entityResolutionReducer = handleActions(
  {
    [updateSetting]: (state, { payload: { name, value } }) => ({
      ...state,
      [name]: value,
    }),
    [updateSettings]: (state, { payload }) => ({
      ...state,
      ...payload,
    }),
    [toggleSetting]: (state, { payload: { name } }) => ({
      ...state,
      [name]: !state[name],
    }),
    [csvTypeChange]: (state, { payload: { checked, type } }) => {
      const csvTypes = new Set(state.csvTypes);
      if (checked) {
        csvTypes.add(type);
      } else {
        csvTypes.delete(type);
      }
      return {
        ...state,
        csvTypes,
      };
    },
    [selectResolution]: (state, { payload }) => ({
      ...state,
      resolutionId: payload,
      createNewResolution: false,
    }),
    [selectCreateNewResolution]: state => ({
      ...state,
      resolutionId: null,
      createNewResolution: true,
    }),
  },
  initialState,
);

const useEntityResolutionState = () => {
  const [state, dispatch] = useReducer(entityResolutionReducer, initialState);

  const handlers = bindActionCreators(actionCreators, dispatch);

  return [state, handlers, dispatch];
};

export default useEntityResolutionState;
