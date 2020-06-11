import { useReducer } from 'react';
import { createAction, handleActions } from 'redux-actions';
import { uniq, findLast, get } from 'lodash';
import { bindActionCreators } from 'redux';
import uuid from 'uuid';
import { nodePrimaryKeyProperty } from '%main/utils/formatters/network';
import { getMatch, getMatchOrResolved } from './selectors';

const resolveMatchAction = createAction(
  'RESOLVE_MATCH',
  (match, action, attributes = {}) => ({
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
  // (??) => ({ matches }) // TODO: where do we get matches?
);

const resolveMatch = (match, attributes) => resolveMatchAction(match, 'RESOLVE', attributes);
const skipMatch = match => resolveMatchAction(match, 'SKIP');
const nextMatch = createAction('NEXT_ENTITY');
const previousMatch = createAction('PREVIOUS_ENTITY');
const reset = createAction('RESET');

const isImplicitMatch = (match) => {
  const a = get(match, ['nodes', 0, '_resolvedId'], Symbol('a'));
  const b = get(match, ['nodes', 1, '_resolvedId'], Symbol('b'));
  return a === b;
};

const getNextMatchIndex = (resolutions, matches, actions) => {
  const currentMatchIndex = actions[actions.length - 1].index + 1;

  const matchOrResolved = getMatchOrResolved(
    getMatch(matches, currentMatchIndex),
    resolutions,
  );

  if (!isImplicitMatch(matchOrResolved)) {
    return { actions, currentMatchIndex };
  }

  const nextActions = [...actions, { index: currentMatchIndex, action: 'IMPLICIT' }];

  return getNextMatchIndex(
    resolutions,
    matches,
    nextActions,
  );
};

const getPreviousMatchIndex = (actions) => {
  console.log({ actions });
  const { index } = findLast(actions, ({ action }) => action !== 'IMPLICIT');
  console.log({ index });

  return index;
};

export const matchActionReducer = matches =>
  ({ actions, resolutions }, { payload: { match, action } }) => {
    const newEntry = { index: match.index, action };
    const matchIndex = actions.findIndex(({ index }) => index === match.index);
    const priorMatches = matchIndex !== -1 ? actions.slice(0, matchIndex) : actions;

    return getNextMatchIndex(resolutions, matches, [...priorMatches, newEntry]);
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

  return resolutions;
};

const initialState = {
  actions: [],
  resolutions: [],
  currentMatchIndex: 0,
};

const entityResolutionReducer = matches =>
  handleActions(
    {
      [resolveMatchAction]: (state, { payload: { match, action, attributes } }) => {
        const resolutions = resolutionsReducer(
          state.resolutions,
          { payload: { match, action, attributes } },
        );

        const {
          actions: matchActions,
          currentMatchIndex,
        } = matchActionReducer(matches)(
          { actions: state.actions, resolutions },
          { payload: { match, action } },
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
        const previousMatchIndex = getPreviousMatchIndex(state.actions);

        const actions = state.actions
          .filter(({ index }) => index < previousMatchIndex);
        const resolutions = state.resolutions
          .filter(({ matchIndex }) => matchIndex < previousMatchIndex);

        return {
          ...state,
          actions,
          resolutions,
          currentMatchIndex: previousMatchIndex,
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

export const actionCreators = {
  resolveMatch,
  skipMatch,
  nextMatch,
  previousMatch,
  reset,
};

const useEntityResolutionState = (matches) => {
  const [state, dispatch] = useReducer(entityResolutionReducer(matches), initialState);

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
