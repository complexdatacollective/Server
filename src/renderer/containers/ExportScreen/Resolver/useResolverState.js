import { useReducer } from 'react';
import { createAction, handleActions } from 'redux-actions';
import { uniq, findLast } from 'lodash';
import { bindActionCreators } from 'redux';
import uuid from 'uuid';
import { nodePrimaryKeyProperty } from '%main/utils/formatters/network';
import { getMatch, getMatchOrResolved } from './selectors';

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
const nextMatch = createAction('NEXT_ENTITY');
const previousMatch = createAction('PREVIOUS_ENTITY');
const reset = createAction('RESET');

export const actionCreators = {
  resolveMatch,
  skipMatch,
  nextMatch,
  previousMatch,
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

  const resolutions = [...priorResolutions, newEntry];

  console.log({ resolutions });

  return resolutions;
};

const initialState = {
  actions: [],
  resolutions: [],
  currentMatchIndex: 0,
};

const entityResolutionReducer = handleActions(
  {
    [resolveMatchAction]: (state, { payload: { match, action, attributes } }) => {
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
    },
    [previousMatch]: (state) => {
      const actions = state.actions
        .filter(({ index }) => index < state.currentMatchIndex - 1);
      const resolutions = state.resolutions
        .filter(({ matchIndex }) => matchIndex < state.currentMatchIndex - 1);

      return {
        ...state,
        actions,
        resolutions,
        currentMatchIndex: state.currentMatchIndex - 1,
      };
    },
    [nextMatch]: state => ({
      ...state,
      currentMatchIndex: state.currentMatchIndex + 1,
    }),
    [reset]: () => ({ ...initialState }),
  },
  initialState,
);

const useEntityResolutionState = (matches) => {
  const [state, dispatch] = useReducer(entityResolutionReducer, initialState);

  const matchOrResolved = getMatchOrResolved(
    getMatch(matches, state.currentMatchIndex),
    state.resolutions,
  );

  const isLastMatch = state.currentMatchIndex >= matches.length;

  const handlers = bindActionCreators(actionCreators, dispatch);

  return [
    {
      ...state,
      isLastMatch,
      match: matchOrResolved,
    },
    handlers,
  ];
};

export default useEntityResolutionState;
