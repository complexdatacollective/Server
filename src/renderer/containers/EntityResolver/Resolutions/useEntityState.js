import { useReducer, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';
import { isEqual, get } from 'lodash';
import { getRequiredAttributes, getMatchId } from './selectors';

const getIsDiffValid = (requiredAttributes, resolvedAttributes) =>
  isEqual(requiredAttributes.sort(), Object.keys(resolvedAttributes).sort());

const getSetAll = (variables, value) =>
  variables.reduce(
    (acc, variable) => ({ ...acc, [variable]: value }),
    {},
  );

const getLeftRight = (nodes, variable, value) => {
  if (nodes[0].attributes[variable] === value) { return { [variable]: 0 }; }
  if (nodes[1].attributes[variable] === value) { return { [variable]: 1 }; }
  return {};
};

const getAutoPopulateFromValues = (variables, match, values) =>
  variables.reduce(
    (acc, variable) => ({ ...acc, ...getLeftRight(match.nodes, variable, values[variable]) }),
    {},
  );

const checkCompleted = (state) => {
  const isDiffValid = (
    state.isMatchType === 'MISMATCH' ||
    getIsDiffValid(state.requiredAttributes, state.resolvedAttributes)
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
  isDiffComplete: false,
  isTouched: false,
  isMatchType: null,
  resolvedAttributes: {},
};

const setAttributes = createAction('SET', attributes => ({ attributes }));
const setLeft = createAction('SET_LEFT');
const setRight = createAction('SET_RIGHT');
const initialize = createAction('INITIALIZE');
const setNotAMatch = createAction('NOT_A_MATCH');

const entityDiffReducer = handleActions({
  [setAttributes]: (state, { payload }) => checkCompleted({
    ...state,
    isTouched: true,
    isMatchType: 'CUSTOM',
    resolvedAttributes: {
      ...state.resolvedAttributes,
      ...payload.attributes,
    },
  }),
  [setLeft]: state => checkCompleted({
    ...state,
    isTouched: true,
    isMatchType: 'LEFT',
    resolvedAttributes: getSetAll(state.requiredAttributes, 0),
  }),
  [setRight]: state => checkCompleted({
    ...state,
    isTouched: true,
    isMatchType: 'RIGHT',
    resolvedAttributes: getSetAll(state.requiredAttributes, 1),
  }),
  [setNotAMatch]: state => checkCompleted({
    ...state,
    resolvedAttributes: {},
    isMatchType: 'MISMATCH',
    isTouched: true,
  }),
  [initialize]: (state, { payload }) => {
    const newState = {
      ...initialState,
      match: payload.match,
      entityDefinition: payload.entityDefinition,
      requiredAttributes: payload.requiredAttributes,
      isTouched: false,
      isMatchType: null,
    };

    if (Object.keys(payload.initialResolvedAttributes).length === 0) {
      return newState;
    }

    const resolvedAttributes = getAutoPopulateFromValues(
      newState.requiredAttributes,
      newState.match,
      payload.initialResolvedAttributes,
    );

    return checkCompleted({
      ...newState,
      isTouched: true,
      resolvedAttributes,
    });
  },
}, initialState);

const useEntityDiffState = (
  entityDefinition,
  match,
  initialResolvedAttributes,
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
      initialResolvedAttributes,
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
