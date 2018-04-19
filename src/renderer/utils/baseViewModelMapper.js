/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

/**
 * Convert API response to a more usable view model
 * @param  {Object} json data from API response entity
 * @return {Object}
 */
const baseViewModelMapper = json => ({
  ...json,
  // Normalize IDs here
  id: json._id,
  _id: undefined,
  // Date types
  createdAt: new Date(json.createdAt),
  updatedAt: new Date(json.updatedAt),
});

export default baseViewModelMapper;
