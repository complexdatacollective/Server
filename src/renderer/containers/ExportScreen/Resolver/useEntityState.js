import { useReducer, useEffect } from 'react';
import { bindActionCreators } from 'redux';
import { createAction, handleActions } from 'redux-actions';
import { isEqual, reduce } from 'lodash';
import { getRequiredAttributes, getMatchId } from './selectors';

const initialState = {
  isTouched: false,
  isAMatch: null,
  resolvedAttributes: {},
};

const setAttributes = createAction('SET', attributes => ({ attributes }));
const reset = createAction('RESET');
const setNotAMatch = createAction('NOT_A_MATCH'),;

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
  codebook,
  match,
  {
    resolveMatch,
    skipMatch,
    previousMatch,
  },
) => {
  const [state, dispatch] = useReducer(entityDiffReducer, initialState);
  const { isTouched, resolvedAttributes, isAMatch } = state;

  const requiredAttributes = getRequiredAttributes(codebook, match);
  const isDiffValid = getIsDiffValid(requiredAttributes, resolvedAttributes);
  const isDiffComplete = isTouched && ((isAMatch && isDiffValid) || !isAMatch);

  const previousDiff = () => {
    if (!(
      !isTouched ||
      window.confirm('Looks like you have set some attributes, are you sure?') // eslint-disable-line
    )) {
      return;
    }

    previousMatch();
  };

  const nextDiff = () => {
    if (!isTouched) {
      return;
    }

    if (isAMatch) {
      // TODO: set error state
      if (!isDiffValid) {
        window.alert("Looks like you haven't chosen all the attributes yet?") // eslint-disable-line
        return;
      }

      const resolved = reduce(resolvedAttributes, (obj, resolution, variable) => ({
        ...obj,
        [variable]: match.nodes[resolution].attributes[variable],
      }), {});

      const fullResolvedAttributes = {
        ...match.nodes[0].attributes, // include values we filtered out (ones that were equal)
        ...resolved,
      };

      console.log({ fullResolvedAttributes });

      resolveMatch(match, fullResolvedAttributes);
      return;
    }

    // if !isAMatch
    skipMatch(match);
  };

  useEffect(() => {
    dispatch(reset());
  }, [getMatchId(match)]);

  const handlers = bindActionCreators({
    setAttributes,
    setNotAMatch,
  }, dispatch);

  return [
    {
      requiredAttributes,
      resolvedAttributes,
      isAMatch,
      isDiffComplete,
    },
    {
      ...handlers,
      previousDiff,
      nextDiff,
    },
  ];
};

export default useEntityDiffState;
