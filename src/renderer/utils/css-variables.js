const getCSSVariable = (prop, element = document.documentElement) => (
  window.getComputedStyle(element).getPropertyValue(prop).trim()
);

/**
 * @param  {...string} props property names (example: '--color-1')
 * @return {array} CSS custom property values
 */
const getCSSVariables = (...props) => props.map(prop => getCSSVariable(prop));

/**
 * @param  {...string} props property names (example: '--color-1')
 * @return {object} CSS custom properties, keyed by property name
 */
const getCSSVariableDict = (...props) => (
  props.reduce((acc, prop) => {
    acc[prop] = getCSSVariable(prop);
    return acc;
  }, {})
);

export {
  getCSSVariable,
  getCSSVariables,
  getCSSVariableDict,
};
