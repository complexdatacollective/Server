import { selectors as protocolSelectors } from './protocols';

/**
 * @module excludedChartVariables
 *
 * @description
 * Allows the user to hide certain ordinal/variable charts from a protocol's Overview display.
 * These are user settings and should be persisted.
 *
 * State shape is sectioned by protocol ID and entity type:
 * ```
 * {
 *   [protocolId]: {
 *     [entity]: {
 *       [entityType]: [variableName1, variableName2]
 *     }
 *   }
 * }
 * ```
 */

const SET_EXCLUDED_VARIABLES = 'SET_EXCLUDED_VARIABLES';

const initialState = {};

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case SET_EXCLUDED_VARIABLES: {
      const { protocolId } = action;
      if (!protocolId) {
        return state;
      }
      const protocolState = {
        ...state[protocolId],
        [action.entity]: {
          ...(state[protocolId] || {})[action.entity],
          [action.section]: action.variables,
        },
      };
      return { ...state, [protocolId]: protocolState };
    }
    default:
      return state;
  }
};

/**
 * @memberof module:excludedChartVariables
 * @param {string} entity corresponds to an entity (e.g. node, edge, ego)
 * @param {string} section corresponds to an entity (node) type
 * @param {Array} variables list of variable names to exclude
 * @return {Object} excluded variable names, sectioned by entity type
 */
const setExcludedVariables = (protocolId, entity, section, variables) => ({
  type: SET_EXCLUDED_VARIABLES,
  protocolId,
  entity,
  section,
  variables,
});

const excludedVariablesForCurrentProtocol = (state, props) => {
  const protocol = protocolSelectors.currentProtocol(state, props);
  return protocol && state.excludedChartVariables[protocol.id];
};

const actionCreators = {
  setExcludedVariables,
};

const actionTypes = {
  SET_EXCLUDED_VARIABLES,
};

const selectors = {
  excludedVariablesForCurrentProtocol,
};

export {
  actionCreators,
  actionTypes,
  selectors,
};

export default reducer;
