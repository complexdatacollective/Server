import { useReducer } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';

const toggleEntityResolution = createAction('TOGGLE_ENTITY_RESOLUTION');
const selectSnapshot = createAction('SELECT_SNAPSHOT');
const setCreateNewSnapshot = createAction('SET_CREATE_NEW_SNAPSHOT');
const changeEntityResolutionPath = createAction('CHANGE_ENTITY_RESOLUTION_PATH');

export const actionCreators = {
  toggleEntityResolution,
  selectSnapshot,
  setCreateNewSnapshot,
  changeEntityResolutionPath,
};

const initialState = {
  enableEntityResolution: false,
  selectedSnapshot: null,
  createNewSnapshot: false,
  entityResolutionPath: '/Users/steve/Projects/teamgarlic/codaco/network-canvas-er/EntityResolution',
};

const entityResolutionReducer = handleActions(
  {
    [toggleEntityResolution]: (state) => {
      if (state.enableEntityResolution) {
        return {
          ...state,
          enableEntityResolution: false,
          selectedSnapshot: null,
          createNewSnapshot: false,
        };
      }
      return { ...state, enableEntityResolution: true };
    },
    [selectSnapshot]: (state, { payload }) => {
      // if (!state.enableEntityResolution) { return state; }
      return { ...state, selectedSnapshot: payload, createNewSnapshot: false };
    },
    [setCreateNewSnapshot]: (state) => {
      // if (!state.enableEntityResolution) { return state; }
      return { ...state, selectedSnapshot: null, createNewSnapshot: true };
    },
    [changeEntityResolutionPath]: (state, { payload }) => {
      // if (!state.enableEntityResolution) { return state; }
      return { ...state, entityResolutionPath: payload };
    },
  },
  initialState,
);
const useEntityResolutionState = () => {
  const [state, dispatch] = useReducer(entityResolutionReducer, initialState);

  const handlers = bindActionCreators(actionCreators, dispatch);

  return [state, handlers, dispatch];
};

export default useEntityResolutionState;
