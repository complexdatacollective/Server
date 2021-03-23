import { useReducer, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';
import { isEqual, isNil, get } from 'lodash';
import { getRequiredAttributes, getMatchId } from './selectors';

const matchTypes = {
  MISMATCH: 'MISMATCH',
  CUSTOM: 'CUSTOM',
  RIGHT: 'RIGHT',
  LEFT: 'LEFT',
};

const getIsDiffValid = (
  requiredAttributes, resolvedAttributes,
) => isEqual(requiredAttributes.sort(), Object.keys(resolvedAttributes).sort());

const getSetAll = (variables, value) => variables.reduce(
  (acc, variable) => ({ ...acc, [variable]: value }),
  {},
);

const getLeftRight = (nodes, variable, value) => {
  if (isNil(value)) { return {}; }
  if (nodes[0].attributes[variable] === value) { return { [variable]: 0 }; }
  if (nodes[1].attributes[variable] === value) { return { [variable]: 1 }; }
  return {};
};

const translateResolvedAttributes = (variables, match, values) => variables.reduce(
  (acc, variable) => {
    const value = get(values, variable);
    return {
      ...acc,
      ...getLeftRight(match.nodes, variable, value),
    };
  },
  {},
);

// We assume that this is an already completed resolution,
// so do not need to check resolvedAttributes length
const getCompletedMatchTypeFromAttributes = (resolvedAttributes) => {
  if (!resolvedAttributes) { return null; }

  const selected = Object.values(resolvedAttributes);
  const left = selected.every((v) => v === 0);
  const right = selected.every((v) => v === 1);

  if (selected.length === 0) { return matchTypes.MISMATCH; }
  if (left) { return matchTypes.LEFT; }
  if (right) { return matchTypes.RIGHT; }

  return matchTypes.CUSTOM;
};

const checkCompleted = (state) => {
  const isDiffValid = (
    state.isMatchType === matchTypes.MISMATCH
    || getIsDiffValid(state.requiredAttributes, state.resolvedAttributes)
  );

  const isDiffComplete = state.isTouched && isDiffValid;

  return {
    ...state,
    isDiffComplete,
  };
};

const initialState = {
  match: null,
  entityDefinition: null,
  requiredAttributes: [],
  isDiffComplete: true,
  isTouched: false,
  isMatchType: null,
  resolvedAttributes: {},
};

const setAttributes = createAction('SET', (attributes) => ({ attributes }));
const setLeft = createAction('SET_LEFT');
const setRight = createAction('SET_RIGHT');
const initialize = createAction('INITIALIZE');
const setNotAMatch = createAction('NOT_A_MATCH');

const entityDiffReducer = handleActions({
  [setAttributes]: (state, { payload }) => checkCompleted({
    ...state,
    isTouched: true,
    isMatchType: matchTypes.CUSTOM,
    resolvedAttributes: {
      ...state.resolvedAttributes,
      ...payload.attributes,
    },
  }),
  [setLeft]: (state) => checkCompleted({
    ...state,
    isTouched: true,
    isMatchType: matchTypes.LEFT,
    resolvedAttributes: getSetAll(state.requiredAttributes, 0),
  }),
  [setRight]: (state) => checkCompleted({
    ...state,
    isTouched: true,
    isMatchType: matchTypes.RIGHT,
    resolvedAttributes: getSetAll(state.requiredAttributes, 1),
  }),
  [setNotAMatch]: (state) => checkCompleted({
    ...state,
    resolvedAttributes: {},
    isMatchType: matchTypes.MISMATCH,
    isTouched: true,
  }),
  [initialize]: (state, { payload }) => {
    const newState = {
      ...initialState,
      match: payload.match,
      entityDefinition: payload.entityDefinition,
      requiredAttributes: payload.requiredAttributes,
      isTouched: true,
      isMatchType: matchTypes.MISMATCH,
      isDiffComplete: true,
    };

    if (!payload.existingAction) {
      return newState;
    }

    const resolvedAttributes = translateResolvedAttributes(
      newState.requiredAttributes,
      newState.match,
      payload.existingResolvedAttributes,
    );

    const isMatchType = getCompletedMatchTypeFromAttributes(resolvedAttributes);

    return checkCompleted({
      ...newState,
      isTouched: true,
      resolvedAttributes,
      isMatchType,
    });
  },
}, initialState);

const useEntityDiffState = (
  entityDefinition,
  match,
  existingResolvedAttributes,
  existingAction,
) => {
  const [state, dispatch] = useReducer(entityDiffReducer, initialState);
  const {
    isTouched,
    resolvedAttributes,
    isMatchType,
    requiredAttributes,
    isDiffComplete,
  } = state;

  useEffect(() => {
    const nextRequiredAttributes = getRequiredAttributes(entityDefinition, match);
    dispatch(initialize({
      entityDefinition,
      match,
      requiredAttributes: nextRequiredAttributes,
      existingResolvedAttributes,
      existingAction,
    }));
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
    isMatchType,
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
