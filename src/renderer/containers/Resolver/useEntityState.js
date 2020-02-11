import { useReducer } from 'react';
import { createActions, handleActions } from 'redux-actions';

const initialState = {};

const actionCreators = createActions({
  SET_ALL: entity => ({ entity }),
  SET: (attribute, value) => ({ attribute, value }),
});

const entityDiffReducer = handleActions({
  [actionCreators.setAll]: (state, { payload }) => ({
    ...payload.entity,
  }),
  [actionCreators.set]: (state, { payload }) => ({
    ...state,
    [payload.attribute]: payload.value,
  }),
}, initialState);

const useEntityDiffState = () => {
  const [state, dispatch] = useReducer(entityDiffReducer, initialState);

  const handleSetAll = attributes =>
    dispatch(actionCreators.setAll(attributes));

  const handleSet = (variable, value) =>
    dispatch(actionCreators.set(variable, value));

  return [
    state,
    handleSet,
    handleSetAll,
  ];
};

export default useEntityDiffState;
