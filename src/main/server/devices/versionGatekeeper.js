const logger = require('electron-log');

const SERVER_API_VERSION = '1';

const versionGatekeeper = (req, res, next) => {
  const deviceApiVersion = req.header('X-Device-API-Version', 'Not specified');
  if (deviceApiVersion !== SERVER_API_VERSION) {
    logger.warn('[DeviceAPI]', {
      error: 'X-Device-API-Version mismatch.',
      server: SERVER_API_VERSION,
      device: deviceApiVersion,
    });
    res.send(
      400,
      {
        error: 'Device API version mismatch.',
        server: SERVER_API_VERSION,
        device: deviceApiVersion,
      },
    );
    return next(false);
  }

  return next();
};

versionGatekeeper.SERVER_API_VERSION = SERVER_API_VERSION;

module.exports = versionGatekeeper;
