import { useReducer } from 'react';
import { createAction, handleActions } from 'redux-actions';

const toggleEntityResolution = createAction('TOGGLE_ENTITY_RESOLUTION');
const selectSnapshot = createAction('SELECT_SNAPSHOT');
const createNewSnapshot = createAction('CREATE_NEW_SNAPSHOT');

const initialState = {
  enableEntityResolution: false,
  selectedSnapshot: null,
  createNewSnapshot: false,
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
      if (!state.enableEntityResolution) return state;
      return { ...state, selectedSnapshot: payload, createNewSnapshot: false };
    },
    [createNewSnapshot]: (state) => {
      if (!state.enableEntityResolution) return state;
      return { ...state, selectedSnapshot: null, createNewSnapshot: true };
    },
  },
  initialState,
);
const useEntityResolutionState = () =>
  useReducer(entityResolutionReducer, initialState);

const actionCreators = {
  toggleEntityResolution,
  selectSnapshot,
  createNewSnapshot,
};

export { actionCreators };

export default useEntityResolutionState;
