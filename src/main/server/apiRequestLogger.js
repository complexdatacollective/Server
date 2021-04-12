const logger = require('electron-log');

const format = (req, res, tag = 'API') => (
  `[${tag}] ${req.method} ${req.url} - ${res.statusCode}`
);

/**
 * Logging plugin to be used on restify's `after` event
 */
const apiRequestLogger = (tag) => (req, res/* , route, err */) => {
  logger.debug(format(req, res, tag));
};

module.exports = apiRequestLogger;
