/**
 * @module excludedChartVariables
 *
 * @description
 * Allows the user to hide certain ordinal/variable charts from a protocol's Overview display.
 * These are user settings and should be persisted.
 *
 * State shape is sectioned by entity type:
 * ```
 * {
 *   [entityType]: [variableName1, variableName2]
 * }
 * ```
 */

const SET_EXCLUDED_VARIABLES = 'SET_EXCLUDED_VARIABLES';

const initialState = {};

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case SET_EXCLUDED_VARIABLES:
      return { ...state, [action.section]: action.variables };
    default:
      return state;
  }
};

/**
 * @memberof module:excludedChartVariables
 * @param {string} section corresponds to an entity (node) type
 * @param {Array} variables list of variable names to exclude
 * @return {Object} excluded variable names, sectioned by entity type
 */
const setExcludedVariables = (section, variables) => ({
  type: SET_EXCLUDED_VARIABLES,
  section,
  variables,
});

const actionCreators = {
  setExcludedVariables,
};

const actionTypes = {
  SET_EXCLUDED_VARIABLES,
};

export {
  actionCreators,
  actionTypes,
};

export default reducer;
