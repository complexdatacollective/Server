const restify = require('restify');
const logger = require('electron-log');
const corsMiddleware = require('restify-cors-middleware');
const detectPort = require('detect-port');

const apiRequestLogger = require('./apiRequestLogger');
const DeviceManager = require('../data-managers/DeviceManager');
const ProtocolManager = require('../data-managers/ProtocolManager');

const DefaultPort = 8080;

const ApiName = 'AdminAPI';
const ApiVersion = '0.0.1';

// Admin API should listen *only* on loopback
const Host = '127.0.0.1';

/**
 * Provides a RESTful API for electron renderer clients on the same machine.
 */
class AdminService {
  constructor({ statusDelegate, dataDir }) {
    this.api = this.createApi();
    this.statusDelegate = statusDelegate;
    this.deviceManager = new DeviceManager(dataDir);
    this.protocolManager = new ProtocolManager(dataDir);
  }

  /**
   * Start API listening on an open port.
   * @param  {string|number} port number in valid range [1024,65535]
   * @return {Promise}
   */
  start(port = DefaultPort) {
    const portNum = parseInt(port, 10);
    return detectPort(portNum).then((availablePort) => {
      if (portNum !== availablePort) {
        logger.info(`Port ${portNum} taken. Trying ${availablePort}...`);
      }
      return new Promise((resolve) => {
        // Technically the port may no longer be available;
        // Node sets SO_REUSEADDR so port # is reused.
        // TODO: determine if we need something more resilient.
        this.api.listen(availablePort, Host, () => {
          this.port = availablePort;
          logger.info(`${this.api.name} listening at ${this.api.url}`);
          resolve(this);
        });
      });
    });
    // TODO: decide on service failure case/messaging. Crash for now.
  }

  stop() {
    return new Promise((resolve) => {
      this.api.close(() => {
        this.port = null;
        resolve();
      });
    });
  }

  createApi() {
    const api = restify.createServer({
      name: ApiName,
      onceNext: true,
      version: ApiVersion,
    });

    api.use(restify.plugins.bodyParser());

    if (process.env.NODE_ENV === 'development') {
      // Allow origin access from the live-reload server.
      // Production accesses from file:, so nothing needed there.
      const devServerMatch = /^https?:\/\/localhost:[\d]+$/;
      const cors = corsMiddleware({
        origins: [devServerMatch],
      });
      api.pre(cors.preflight);
      api.use(cors.actual);
      api.on('after', apiRequestLogger('AdminAPI'));
    }

    api.get('/health', (req, res, next) => {
      const status = this.statusDelegate && this.statusDelegate.status();
      if (status) {
        res.send({ status: 'ok', serverStatus: status });
      } else {
        res.send(503, { status: 'error' });
      }
      next();
    });

    api.get('/devices', (req, res, next) => {
      this.deviceManager.fetchDeviceList()
        .then(devices => res.send({ status: 'ok', devices }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(() => next());
    });

    api.post('/protocols', (req, res, next) => {
      const files = req.body.files;
      this.protocolManager.validateAndImport(files)
        .then(saved => res.send({ status: 'ok', protocols: saved }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error', message: err.message });
        })
        .then(() => next());
    });

    api.get('/protocols', (req, res, next) => {
      this.protocolManager.allProtocols()
        .then(protocols => res.send({ status: 'ok', protocols }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(() => next());
    });

    // Deprecated; will remove if not needed.
    api.get('/protocols/:id', (req, res, next) => {
      this.protocolManager.getProtocol(req.params.id)
        .then(protocol => res.send({ status: 'ok', protocol }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(() => next());
    });

    api.get('/protocols/:id/sessions', (req, res, next) => {
      // For now, hardcode response limit & offset
      // TODO: paginated API if needed
      const limit = 100;
      this.protocolManager.getProtocolSessions(req.params.id)
        .then(sessions => res.send({
          status: 'ok',
          totalSessions: sessions.length,
          sessions: sessions.slice(0, limit),
        }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(() => next());
    });

    api.del('/protocols/:protocolId', (req, res, next) => {
      const { protocolId } = req.params;
      this.protocolManager.deleteProtocolSessions(protocolId)
        .then(() => this.protocolManager.getProtocol(protocolId))
        .then(protocol => this.protocolManager.destroyProtocol(protocol))
        .then(() => res.send({ status: 'ok' }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(() => next());
    });

    api.del('/protocols/:protocolId/sessions', (req, res, next) => {
      this.protocolManager.deleteProtocolSessions(req.params.protocolId)
        .then(() => res.send({ status: 'ok' }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(() => next());
    });

    api.del('/protocols/:protocolId/sessions/:id', (req, res, next) => {
      this.protocolManager.deleteProtocolSessions(req.params.protocolId, req.params.id)
        .then(() => res.send({ status: 'ok' }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(() => next());
    });

    return api;
  }

  // TODO: Probably remove after alpha testing
  resetData() {
    return Promise.all([
      this.deviceManager.destroyAllDevices(),
      this.protocolManager.destroyAllProtocols(),
      this.protocolManager.destroyAllSessions(),
    ]);
  }
}

module.exports = {
  AdminService,
};
