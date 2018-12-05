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
};
