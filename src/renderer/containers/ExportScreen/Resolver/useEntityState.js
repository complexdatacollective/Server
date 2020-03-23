import { useReducer } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';

const initialState = {
  showHidden: false,
  resolvedAttributes: {},
};

const actionCreators = {
  set: createAction('SET', attributes => ({ attributes })),
  reset: createAction('RESET'),
  toggleHidden: createAction('TOGGLE_HIDDEN'),
};

const entityDiffReducer = handleActions({
  [actionCreators.set]: (state, { payload }) => ({
    ...state,
    resolvedAttributes: {
      ...state.resolvedAttributes,
      ...payload.attributes,
    },
  }),
  [actionCreators.reset]: () => ({
    ...initialState,
  }),
  [actionCreators.toggleHidden]: state => ({
    ...state,
    showHidden: !state.showHidden,
  }),
}, initialState);

const useEntityDiffState = () => {
  const [state, dispatch] = useReducer(entityDiffReducer, initialState);

  const handlers = bindActionCreators(actionCreators, dispatch);

  return [
    state,
    handlers,
  ];
};

export default useEntityDiffState;
