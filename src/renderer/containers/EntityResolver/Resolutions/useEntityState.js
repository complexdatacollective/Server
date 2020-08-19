import { useReducer, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';
import { isEqual } from 'lodash';
import { getRequiredAttributes, getMatchId } from './selectors';

const initialState = {
  isTouched: false,
  isAMatch: null,
  resolvedAttributes: {},
};

const setAttributes = createAction('SET', attributes => ({ attributes }));
const reset = createAction('RESET');
const setNotAMatch = createAction('NOT_A_MATCH');

const entityDiffReducer = handleActions({
  [setAttributes]: (state, { payload }) => ({
    ...state,
    isTouched: true,
    isAMatch: true,
    resolvedAttributes: {
      ...state.resolvedAttributes,
      ...payload.attributes,
    },
  }),
  [reset]: () => ({
    ...initialState,
    isTouched: false,
    isAMatch: null,
  }),
  [setNotAMatch]: () => ({
    ...initialState,
    isAMatch: false,
    isTouched: true,
  }),
}, initialState);

const getIsDiffValid = (requiredAttributes, resolvedAttributes) =>
  isEqual(requiredAttributes, Object.keys(resolvedAttributes));

const useEntityDiffState = (
  entityDefinition,
  match,
) => {
  const [state, dispatch] = useReducer(entityDiffReducer, initialState);
  const { isTouched, resolvedAttributes, isAMatch } = state;

  useEffect(() => {
    dispatch(reset());
  }, [getMatchId(match)]);

  const requiredAttributes = getRequiredAttributes(entityDefinition, match);
  const isDiffValid = getIsDiffValid(requiredAttributes, resolvedAttributes);
  const isDiffComplete = isTouched && ((isAMatch && isDiffValid) || !isAMatch);

  const diffActions = bindActionCreators({
    setAttributes,
    setNotAMatch,
  }, dispatch);

  const diffState = {
    requiredAttributes,
    resolvedAttributes,
    isAMatch,
    isDiffComplete,
    isTouched,
  };

  return [
    diffState,
    diffActions,
  ];
};

export default useEntityDiffState;
