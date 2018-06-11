const logger = require('electron-log');

const format = (req, res, tag = 'API') => (
  `[${tag}] ${req.method} ${req.url} - ${res.statusCode}`
);

const apiRequestLogger = tag => (req, res, next) => {
  logger.info(format(req, res, tag));
  return next();
};

module.exports = apiRequestLogger;
