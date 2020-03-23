import { useReducer } from 'react';
import { createAction, handleActions } from 'redux-actions';
import { uniq, findLast } from 'lodash';
import { bindActionCreators } from 'redux';
import uuid from 'uuid';
import { nodePrimaryKeyProperty } from '%main/utils/formatters/network';

const resolveMatchAction = createAction(
  'RESOLVE_MATCH', (match, action, attributes = {}) => ({
    match: {
      ...match,
      nodes: [
        match.nodes[0][nodePrimaryKeyProperty],
        match.nodes[1][nodePrimaryKeyProperty],
      ],
    },
    action,
    attributes,
  }),
);

const resolveMatch = (match, attributes) => resolveMatchAction(match, 'RESOLVE', attributes);
const skipMatch = match => resolveMatchAction(match, 'SKIP');
const nextEntity = createAction('NEXT_ENTITY');
const previousEntity = createAction('PREVIOUS_ENTITY');
const reset = createAction('RESET');

export const actionCreators = {
  resolveMatch,
  skipMatch,
  nextMatch: nextEntity,
  previousMatch: previousEntity,
  reset,
};

export const matchActionReducer = (state, { payload: { match, action } }) => {
  const newEntry = { index: match.index, action };
  const matchIndex = state.findIndex(({ index }) => index === match.index);
  const priorMatches = matchIndex !== -1 ? state.slice(0, matchIndex) : state;

  return [...priorMatches, newEntry];
};

const getLatestXorResolutionNodes = (state, includeEntity, excludeEntity) => {
  const resolution = findLast(
    state,
    ({ nodes }) => nodes.includes(includeEntity) && !nodes.includes(excludeEntity),
  );

  return resolution ? resolution.nodes : [];
};

export const resolutionsReducer = (state, { payload: { match, action, attributes } }) => {
  const resolutionIndex = state.findIndex(({ matchIndex }) => matchIndex === match.index);
  const priorResolutions = resolutionIndex !== -1 ? state.slice(0, resolutionIndex) : state;

  if (action === 'SKIP') {
    return priorResolutions;
  }

  const [entityA, entityB] = match.nodes;

  const priorResolutionEntityA = getLatestXorResolutionNodes(state, entityA, entityB);
  const priorResolutionEntityB = getLatestXorResolutionNodes(state, entityB, entityA);

  const nodes = uniq([].concat(
    match.nodes,
    priorResolutionEntityA,
    priorResolutionEntityB,
  )).sort();

  const newEntry = {
    matchIndex: match.index,
    id: uuid(),
    nodes,
    attributes,
  };

  return [...priorResolutions, newEntry];
};

const initialState = {
  actions: [],
  resolutions: [],
  currentMatchIndex: 0,
};

export const resolveReducer = (state, { type, payload: { match, action, attributes } }) => {
  if (type === reset) {
    return initialState;
  }

  const matchActions = matchActionReducer(state.actions, { payload: { match, action } });
  const currentMatchIndex = matchActions[matchActions.length - 1].index + 1;
  const resolutions = resolutionsReducer(
    state.resolutions,
    { payload: { match, action, attributes } },
  );

  const newState = {
    ...state,
    currentMatchIndex,
    actions: matchActions,
    resolutions,
  };

  return newState;
};

const entityResolutionReducer = handleActions(
  {
    [resolveMatchAction]: resolveReducer,
    [previousEntity]: state => ({
      ...state,
      currentMatchIndex: state.currentMatchIndex - 1,
    }),
    [nextEntity]: state => ({
      ...state,
      currentMatchIndex: state.currentMatchIndex + 1,
    }),
  },
  initialState,
);

const useEntityResolutionState = () => {
  const [state, dispatch] = useReducer(entityResolutionReducer, initialState);

  const handlers = bindActionCreators(actionCreators, dispatch);

  return [state, handlers];
};

export default useEntityResolutionState;