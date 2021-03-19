const logger = require('electron-log');

const versionGatekeeper = (SERVER_API_VERSION = '0') => (req, res, next) => {
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
        status: 'version_mismatch',
        error: 'Device API version mismatch.',
        server: SERVER_API_VERSION,
        device: deviceApiVersion,
      },
    );
    return next(false);
  }

  return next();
};

module.exports = versionGatekeeper;
