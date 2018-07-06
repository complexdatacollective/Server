const { InvalidCredentialsError, NotAuthorizedError } = require('restify-errors');

/**
 * Server plugin for client auth.
 * Requires "authorization" and "username" to be set on request
 * (as with the restify authorizationParser plugin).
 *
 * Preliminary (insecure) version: checks device ID on request. Eventually,
 * will check client certs or use encrypted payloads (TBD).
 *
 * @param {Object} deviceManager a device manager used to check credentials
 * @param {Array} exceptPaths whitelist for routes not needing auth
 */
const deviceAuthenticator = (deviceManager, exceptPaths = []) => (req, res, next) => {
  if (exceptPaths.indexOf(req.getRoute().path) > -1) {
    next();
    return;
  }

  if (!req.authorization.scheme || req.authorization.scheme !== 'Basic') {
    res.header('WWW-Authenticate', 'Basic');
    next(new InvalidCredentialsError('Invalid Credentials'));
    return;
  }

  if (!req.username || req.username === 'anonymous') {
    next(new InvalidCredentialsError('Invalid Credentials'));
    return;
  }

  deviceManager.exists(req.username).then((exists) => {
    if (exists) {
      next();
    } else {
      next(new NotAuthorizedError('Unauthorized'));
    }
  });
};

module.exports = deviceAuthenticator;
