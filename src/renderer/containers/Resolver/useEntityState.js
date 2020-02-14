import { useReducer } from 'react';
import { createAction, handleActions } from 'redux-actions';

const initialState = {};

const actionCreators = {
  set: createAction('SET', attributes => ({ attributes })),
  reset: createAction('RESET'),
};

const entityDiffReducer = handleActions({
  [actionCreators.set]: (state, { payload }) => ({
    ...state,
    ...payload.attributes,
  }),
  [actionCreators.reset]: () => ({
    ...initialState,
  }),
}, initialState);

const useEntityDiffState = () => {
  const [state, dispatch] = useReducer(entityDiffReducer, initialState);

  const set = attributes =>
    dispatch(actionCreators.set(attributes));

  const reset = () =>
    dispatch(actionCreators.reset());

  return [
    state,
    set,
    reset,
  ];
};

export default useEntityDiffState;
