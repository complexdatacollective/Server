const getCSSValue = (prop, element = document.documentElement) => (
  window.getComputedStyle(element).getPropertyValue(prop).trim()
);

const getCSSNumber = (prop, element = document.documentElement) => (
  Number(getCSSValue(prop, element))
);

// Compatibility with Architect. TODO: refactor (NC#738)
const getCSSVariableAsNumber = getCSSNumber;

/**
 * @param  {...string} props property names (example: '--color-1')
 * @return {array} CSS custom property values
 */
const getCSSValues = (...props) => props.map(prop => getCSSValue(prop));

/**
 * Produce a range of related values, e.g. for graph colors.
 * @param {string} prefix beginning of the CSS variable name, e.g. '--graph-data-'
 * @param {Number} fromIndex
 * @param {Number} toIndex must be greater than fromIndex
 * @return {Array} computed property values
 */
const getCSSValueRange = (prefix, fromIndex, toIndex) =>
  Array.from(Array(toIndex - fromIndex + 1)).map((el, i) => getCSSValue(`${prefix}${i + fromIndex}`));

/**
 * @param  {...string} props property names (example: '--color-1')
 * @return {object} CSS custom properties, keyed by property name
 */
const getCSSValueDict = (...props) => (
  props.reduce((acc, prop) => {
    acc[prop] = getCSSValue(prop);
    return acc;
  }, {})
);

export {
  getCSSValue,
  getCSSNumber,
  getCSSVariableAsNumber,
  getCSSValues,
  getCSSValueDict,
  getCSSValueRange,
};
