const logger = require('electron-log');

// MDNS is optional; ignore load errors caused by runtime config.
let mdns = null;
try {
  mdns = require('mdns'); // eslint-disable-line global-require
} catch (err) {
  logger.warn('MDNS unavailable');
  logger.warn(err);
}

module.exports = {
  mdns,
  mdnsIsSupported: mdns !== null,
};
