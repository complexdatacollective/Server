import { useReducer } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';

const initialState = {
  isTouched: false,
  isMatch: null,
  showHidden: false,
  resolvedAttributes: {},
};

const actionCreators = {
  set: createAction('SET', attributes => ({ attributes })),
  reset: createAction('RESET'),
  toggleHidden: createAction('TOGGLE_HIDDEN'),
  setNoMatch: createAction('NO_MATCH'),
};

const entityDiffReducer = handleActions({
  [actionCreators.set]: (state, { payload }) => ({
    ...state,
    isTouched: true,
    isMatch: true,
    resolvedAttributes: {
      ...state.resolvedAttributes,
      ...payload.attributes,
    },
  }),
  [actionCreators.reset]: () => ({
    ...initialState,
    isTouched: false,
    isMatch: null,
  }),
  [actionCreators.toggleHidden]: state => ({
    ...state,
    showHidden: !state.showHidden,
  }),
  [actionCreators.setNoMatch]: () => ({
    ...initialState,
    isMatch: false,
    isTouched: true,
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
