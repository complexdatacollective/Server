import { useReducer, useEffect } from 'react';
import { createAction, handleActions } from 'redux-actions';
import { uniq, findLast, get } from 'lodash';
import { bindActionCreators } from 'redux';
import uuid from 'uuid';
import { nodePrimaryKeyProperty } from '../../../main/utils/formatters/network';
import { getMatch, getMatchOrResolved } from './selectors';

const resolveTypes = {
  skip: 'skip',
  match: 'match',
  implicit: 'implicit',
};

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

  const nextActions = [...actions, { index: currentMatchIndex, action: resolveTypes.implicit }];

  return getNextMatchIndex(
    resolutions,
    matches,
    nextActions,
  );
};

const getPreviousMatchIndex = (actions, untilIndex) => {
  const actionsUntilIndex = untilIndex ?
    actions.filter(({ index }) => index < untilIndex) :
    actions;
  const { index } = findLast(actionsUntilIndex, ({ action }) => action !== resolveTypes.implicit);

  return index;
};

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
);

const resolveMatch = (match, attributes) =>
  resolveMatchAction(match, resolveTypes.match, attributes);
const skipMatch = match => resolveMatchAction(match, resolveTypes.skip);
const nextMatch = createAction('NEXT_ENTITY');
const previousMatch = createAction('PREVIOUS_ENTITY');
const reset = createAction('RESET');

export const actionCreators = {
  resolveMatch,
  skipMatch,
  nextMatch,
  previousMatch,
};

export const reduceActions = matches =>
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

export const reduceResolutions = (state, { payload: { match, action, attributes } }) => {
  const resolutionIndex = state.findIndex(({ matchIndex }) => matchIndex === match.index);
  const priorResolutions = resolutionIndex !== -1 ? state.slice(0, resolutionIndex) : state;

  if (action === resolveTypes.skip) {
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
        const resolutions = reduceResolutions(
          state.resolutions,
          { payload: { match, action, attributes } },
        );

        const actions = reduceActions(matches)(
          { actions: state.actions, resolutions },
          { payload: { match, action } },
        );

        const newState = {
          ...state,
          ...actions, // { actions, currentMatchIndex }
          resolutions,
        };

        return newState;
      },
      [previousMatch]: (state) => {
        const previousMatchIndex = getPreviousMatchIndex(state.actions, state.currentMatchIndex);

        const actions = state.actions
          .filter(({ index }) => index <= previousMatchIndex);
        // keep the last resolution so that we can see it in entity diff
        const resolutions = state.resolutions
          .filter(({ matchIndex }) => matchIndex <= previousMatchIndex);

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
      [reset]: () => initialState,
    },
    initialState,
  );

const useResolutionsState = (matches, resetOnProps) => {
  const [state, dispatch] = useReducer(entityResolutionReducer(matches), initialState);

  useEffect(() => {
    dispatch(reset());
  }, resetOnProps);

  const match = getMatch(matches, state.currentMatchIndex);

  const matchOrResolved = getMatchOrResolved(
    match,
    // everything but (potentially) the last resolution
    state.resolutions.filter(({ matchIndex }) => matchIndex < state.currentMatchIndex),
  );

  const isLastMatch = state.currentMatchIndex >= matches.length;

  // check if there is an existing resolution
  const existingResolution = state.resolutions
    .find(
      ({ matchIndex: resolutionMatchIndex }) =>
        resolutionMatchIndex === state.currentMatchIndex,
    );
  const existingResolvedAttributes = get(existingResolution, 'attributes');
  const existingAction = state.actions
    .find(({ index }) => index === state.currentMatchIndex);

  const handlers = bindActionCreators(actionCreators, dispatch);

  return [
    {
      ...state,
      isLastMatch,
      match: matchOrResolved,
      existingResolvedAttributes,
      existingAction,
    },
    handlers,
  ];
};

export default useResolutionsState;
