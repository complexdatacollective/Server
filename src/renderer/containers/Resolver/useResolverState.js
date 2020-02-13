import { useReducer } from 'react';
import { createAction, handleActions } from 'redux-actions';
import { uniq } from 'lodash';


const resolveMatch = createAction(
  'RESOLVE_ENTITY', (match, action, attributes = {}) => ({
    match,
    action,
    attributes,
  }),
);
const nextEntity = createAction('NEXT_ENTITY');
const previousEntity = createAction('PREVIOUS_ENTITY');

export const matchesReducer = (state, { payload: { match, action } }) => {
  const newEntry = { index: match.index, action };
  const matchIndex = state.findIndex(({ index }) => index === match.index);
  const priorMatches = matchIndex !== -1 ? state.slice(0, matchIndex) : state;

  return [...priorMatches, newEntry];
};

const getLatestXorResolutionNodes = (state, includeEntity, excludeEntity) => {
  const resolution = state.reverse()
    .find(({ nodes }) => nodes.includes(includeEntity) && !nodes.includes(excludeEntity));

  return resolution ? resolution.nodes : [];
};

export const resolutionsReducer = (state, { payload: { match, action, attributes } }) => {
  const resolutionIndex = state.findIndex(({ matchIndex }) => matchIndex === match.index);
  const priorResolutions = resolutionIndex !== -1 ? state.slice(0, resolutionIndex) : state;

  if (action === 'skip') { return priorResolutions; }

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
    nodes,
    attributes,
  };

  return [...priorResolutions, newEntry];
};

const initialState = {
  matches: [],
  resolutions: [],
  currentMatchIndex: 0,
};

const entityResolutionReducer = handleActions(
  {
    [resolveMatch]: (state, { payload: { match, action, attributes } }) => {
      const matches = matchesReducer(state.matches, { payload: { match, action } });
      const currentMatchIndex = matches[matches.length - 1].index;
      const resolutions = resolutionsReducer(
        state.matches,
        { payload: { match, action, attributes } },
      );

      return {
        ...state,
        currentMatchIndex,
        matches,
        resolutions,
      };
    },
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

  const resolve = (match, action, entity) =>
    dispatch(resolveMatch(match, action, entity));

  const next = () => dispatch(nextEntity());

  const previous = () => dispatch(previousEntity());

  return [state, resolve, next, previous];
};

const actionCreators = {
  resolveMatch,
  nextEntity,
  previousEntity,
};

export { actionCreators };

export default useEntityResolutionState;
