const restify = require('restify');
const logger = require('electron-log');

const DeviceManager = require('./deviceManager');
const ProtocolImporter = require('../utils/ProtocolImporter');

const corsMiddleware = require('restify-cors-middleware');

const ApiName = 'AdminAPI';
const ApiVersion = '0.0.1';

// Admin API should listen *only* on loopback
// TODO: IPC socket supported?
const Host = '127.0.0.1';

/**
 * @memberof BackgroundServices
 * @class AdminService
 * Provides a RESTful API for electron renderer clients on the same machine.
 */
class AdminService {
  constructor({ statusDelegate, dataDir }) {
    this.api = this.createApi();
    this.statusDelegate = statusDelegate;
    this.deviceMgr = new DeviceManager(dataDir);
    this.protocolImporter = new ProtocolImporter(dataDir);
  }

  start(port) {
    return new Promise((resolve, reject) => {
      if (!port) {
        reject(new Error('Missing port'));
        return;
      }
      this.api.listen(port, Host, () => {
        logger.info(`${this.api.name} listening at ${this.api.url}`);
        resolve(this);
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      this.api.close(() => {
        resolve();
      });
    });
  }

  createApi() {
    const api = restify.createServer({
      name: ApiName,
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
    }

    api.get('/health', (req, res, next) => {
      const status = this.statusDelegate && this.statusDelegate.status();
      if (status) {
        res.send({ status: 'ok', serverStatus: status });
      } else {
        res.send(503, { status: 'error' });
      }
      return next();
    });

    api.get('/devices', (req, res, next) => {
      this.deviceMgr.fetchDeviceList()
        .then(devices => res.send({ status: 'ok', devices }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(next);
    });

    api.post('/protocols', (req, res, next) => {
      const files = req.body.files;
      this.protocolImporter.validateAndImport(files)
        .then(saved => res.send({ status: 'ok', protocols: saved }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error', message: err.message });
        })
        .then(next);
    });

    api.get('/protocols', (req, res, next) => {
      this.protocolImporter.savedFiles()
        .then(files => res.send({ status: 'ok', protocols: files }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(next);
    });

    return api;
  }
}

module.exports = {
  AdminService,
};
