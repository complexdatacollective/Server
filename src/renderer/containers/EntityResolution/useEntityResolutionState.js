import { useReducer } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';
import { pick } from 'lodash';

const toggleEntityResolution = createAction('TOGGLE_ENTITY_RESOLUTION');
const selectResolution = createAction('SELECT_RESOLUTION');
const setCreateNewResolution = createAction('SET_CREATE_NEW_RESOLUTION');
const changeEntityResolutionPath = createAction('CHANGE_ENTITY_RESOLUTION_PATH');

export const actionCreators = {
  toggleEntityResolution,
  selectResolution,
  setCreateNewResolution,
  changeEntityResolutionPath,
};

const initialState = {
  enableEntityResolution: false,
  resolutionId: null,
  createNewResolution: true,
  entityResolutionPath: '/Users/steve/Projects/teamgarlic/codaco/network-canvas-er/EntityResolution',
};

const entityResolutionReducer = handleActions(
  {
    [toggleEntityResolution]: (state) => {
      if (state.enableEntityResolution) {
        return {
          ...state,
          // TODO: is this necessary or can we reset path too?
          ...pick(initialState, [
            'enableEntityResolution',
            'resolutionId',
            'createNewResolution',
          ]),
        };
      }
      return { ...state, enableEntityResolution: true };
    },
    [selectResolution]: (state, { payload }) => {
      // if (!state.enableEntityResolution) { return state; }
      console.log(payload);
      return { ...state, resolutionId: payload, createNewResolution: false };
    },
    [setCreateNewResolution]: (state) => {
      // if (!state.enableEntityResolution) { return state; }
      return { ...state, resolutionId: null, createNewResolution: true };
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
