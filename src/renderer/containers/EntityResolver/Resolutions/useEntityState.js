import { useReducer, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';
import { isEqual, get } from 'lodash';
import { getRequiredAttributes, getMatchId } from './selectors';


const getIsDiffValid = (requiredAttributes, resolvedAttributes) => {
  console.log({
    req: requiredAttributes.sort(),
    res: Object.keys(resolvedAttributes).sort(),
  });
  return isEqual(requiredAttributes.sort(), Object.keys(resolvedAttributes).sort());
};

const getSetAll = (variables, value) =>
  variables.reduce(
    (acc, variable) => ({ ...acc, [variable]: value }),
    {},
  );

const checkCompleted = (state) => {
  const isDiffValid = (
    state.isNotAMatch === true ||
    getIsDiffValid(state.requiredAttributes, state.resolvedAttributes)
  );
  const isDiffComplete = state.isTouched && isDiffValid;

  return {
    ...state,
    isDiffComplete,
  };
};

const initialState = {
  isDiffComplete: false,
  isTouched: false,
  isNotAMatch: null,
  isMatchAll: null,
  match: null,
  entityDefinition: null,
  resolvedAttributes: {},
  requiredAttributes: [],
};

const setAttributes = createAction('SET', attributes => ({ attributes }));
const setLeft = createAction('SET_LEFT');
const setRight = createAction('SET_RIGHT');
const initialize = createAction(
  'INITIALIZE',
  ({ match, entityDefinition, requiredAttributes }) =>
    ({ match, entityDefinition, requiredAttributes }),
);
const setNotAMatch = createAction('NOT_A_MATCH');

const entityDiffReducer = handleActions({
  [setAttributes]: (state, { payload }) => checkCompleted({
    ...state,
    isTouched: true,
    isMatchAll: null,
    isNotAMatch: false,
    resolvedAttributes: {
      ...state.resolvedAttributes,
      ...payload.attributes,
    },
  }),
  [setLeft]: state => checkCompleted({
    ...state,
    isTouched: true,
    isMatchAll: 'LEFT',
    isNotAMatch: false,
    resolvedAttributes: getSetAll(state.requiredAttributes, 0),
  }),
  [setRight]: state => checkCompleted({
    ...state,
    isTouched: true,
    isMatchAll: 'RIGHT',
    isNotAMatch: false,
    resolvedAttributes: getSetAll(state.requiredAttributes, 1),
  }),
  [setNotAMatch]: state => checkCompleted({
    ...state,
    resolvedAttributes: {},
    isNotAMatch: true,
    isTouched: true,
  }),
  [initialize]: (state, { payload }) => ({
    ...initialState,
    match: payload.match,
    entityDefinition: payload.entityDefinition,
    requiredAttributes: payload.requiredAttributes,
    isTouched: false,
    isAMatch: null,
  }),
}, initialState);

const useEntityDiffState = (
  entityDefinition,
  match,
) => {
  const [state, dispatch] = useReducer(entityDiffReducer, initialState);
  const {
    isTouched,
    resolvedAttributes,
    isNotAMatch,
    isMatchAll,
    requiredAttributes,
    isDiffComplete,
  } = state;

  useEffect(() => {
    const nextRequiredAttributes = getRequiredAttributes(entityDefinition, match);
    dispatch(initialize({ entityDefinition, match, requiredAttributes: nextRequiredAttributes }));
  }, [getMatchId(match), get(entityDefinition, 'name')]);

  const diffActions = bindActionCreators({
    setAttributes,
    setLeft,
    setRight,
    setNotAMatch,
  }, dispatch);

  const diffState = {
    requiredAttributes,
    resolvedAttributes,
    isNotAMatch,
    isMatchAll,
    isDiffComplete,
    isTouched,
    match: state.match,
    entityDefinition: state.entityDefinition,
  };

  return [
    diffState,
    diffActions,
  ];
};

export default useEntityDiffState;
