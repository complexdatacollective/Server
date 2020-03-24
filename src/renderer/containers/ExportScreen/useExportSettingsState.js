import { useReducer } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';

const selectResolution = createAction('SELECT_RESOLUTION');
const setCreateNewResolution = createAction('SET_CREATE_NEW_RESOLUTION');
const toggleSetting = createAction('TOGGLE_SETTING', (name, checked) => ({ name, checked }));
const updateSetting = createAction('UPDATE_SETTING', (name, value) => ({ name, value }));
const csvTypeChange = createAction('CSV_TYPE_CHANGE', (type, checked) => ({ checked, type }));

export const actionCreators = {
  selectResolution,
  setCreateNewResolution,
  toggleSetting,
  updateSetting,
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
  createNewResolution: true,
  minimumThreshold: 0,
  entityResolutionPath: '/Users/steve/Projects/teamgarlic/codaco/network-canvas-er/EntityResolution',
};

// CSV Type change
// const handleCsvTypeChange = (evt) => {
//   const csvTypes = new Set(exportSettings.csvTypes);
//   if (evt.target.checked) {
//     csvTypes.add(evt.target.value);
//   } else {
//     csvTypes.delete(evt.target.value);
//   }
//   setExportSettings({ csvTypes });
// };

// UPDATE_SETTING
// const handleFormatChange = (evt) => {
//   const exportFormat = evt.target.value;
//   setExportSettings({ exportFormat });
// };

// TOGGLE_SETTING (update setting?
// const handleUnionChange = (evt) => {
//   setExportSettings({ exportNetworkUnion: evt.target.value === 'true' });
// };

// const handleDirectedEdgesChange = (evt) => {
//   setExportSettings({ useDirectedEdges: evt.target.checked });
// };

// const handleEgoDataChange = (evt) => {
//   setExportSettings({ useEgoData: evt.target.checked });
// };

const entityResolutionReducer = handleActions(
  {
    [updateSetting]: (state, { payload: { name, value } }) => ({
      ...state,
      [name]: value,
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
    [setCreateNewResolution]: state => ({
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
