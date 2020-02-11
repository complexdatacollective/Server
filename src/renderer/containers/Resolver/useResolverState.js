import { useReducer } from 'react';
import { createAction, handleActions } from 'redux-actions';

const resolveEntity = createAction('RESOLVE_ENTITY');
const nextEntity = createAction('NEXT_ENTITY');
const previousEntity = createAction('PREVIOUS_ENTITY');

const initialState = {
  currentEntityIndex: 0,
  resolvedEntities: {}, // use an object so that they can be resolved in any order.
};

const entityResolutionReducer = handleActions(
  {
    [resolveEntity]: (state, { payload: { index, resolution } }) => ({
      ...state,
      currentEntityIndex: state.currentEntityIndex + 1,
      resolvedEntities: {
        ...state.resolvedEntities,
        [index]: resolution,
      },
    }),
    [previousEntity]: state => ({
      ...state,
      currentEntityIndex: state.currentEntityIndex - 1,
    }),
    [nextEntity]: state => ({
      ...state,
      currentEntityIndex: state.currentEntityIndex + 1,
    }),
  },
  initialState,
);
const useEntityResolutionState = () => {
  const [state, dispatch] = useReducer(entityResolutionReducer, initialState);

  const resolve = (i, entity) =>
    dispatch(resolveEntity(i, entity));

  const next = () => dispatch(nextEntity());

  const previous = () => dispatch(previousEntity());

  return [state, resolve, next, previous];
};

const actionCreators = {
  resolveEntity,
  nextEntity,
  previousEntity,
};

export { actionCreators };

export default useEntityResolutionState;
