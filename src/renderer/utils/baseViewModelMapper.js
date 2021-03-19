/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

/**
 * Convert API response to a more usable view model
 * @param  {Object} json data from API response entity
 * @return {Object}
 */
const baseViewModelMapper = (json) => ({
  ...json,
  // Normalize IDs here
  id: json._id,
  _id: undefined,
  // Date types
  createdAt: json.createdAt && new Date(json.createdAt),
  updatedAt: json.updatedAt && new Date(json.updatedAt),
  // TODO: "lastModified" is only for protocols right now; consider protocol-specific mapper
  lastModified: json.lastModified && new Date(json.lastModified),
});

export default baseViewModelMapper;
