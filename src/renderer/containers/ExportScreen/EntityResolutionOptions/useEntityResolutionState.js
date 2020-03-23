import { useReducer } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';
import { pick } from 'lodash';

const toggleEntityResolution = createAction('TOGGLE_ENTITY_RESOLUTION');
const selectResolution = createAction('SELECT_RESOLUTION');
const setCreateNewResolution = createAction('SET_CREATE_NEW_RESOLUTION');
const changeResolutionOptions = createAction('CHANGE_ENTITY_RESOLUTION_OPTIONS');

export const actionCreators = {
  toggleEntityResolution,
  selectResolution,
  setCreateNewResolution,
  changeResolutionOptions,
};

const initialState = {
  enableEntityResolution: false,
  resolutionId: null,
  createNewResolution: true,
  minimumThreshold: 0,
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
            'minimumThreshold',
          ]),
        };
      }
      return { ...state, enableEntityResolution: true };
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
    [changeResolutionOptions]: (state, { payload }) => ({
      ...state,
      ...payload,
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
