const restify = require('restify');
const logger = require('electron-log');
const corsMiddleware = require('restify-cors-middleware');
const detectPort = require('detect-port');

const apiRequestLogger = require('./apiRequestLogger');
const DeviceManager = require('../data-managers/DeviceManager');
const ProtocolManager = require('../data-managers/ProtocolManager');
const ExportManager = require('../data-managers/ExportManager');
const ResolverManager = require('../data-managers/ResolverManager');
const { resetPemKeyPair } = require('./certificateManager');
const { PairingRequestService } = require('./devices/PairingRequestService');
const { RequestError, ErrorMessages } = require('../errors/RequestError');

const DefaultPort = 8080;

const ApiName = 'AdminAPI';
const ApiVersion = '0.0.1';

// Admin API should listen *only* on loopback
const Host = '127.0.0.1';

const codeForError = (err) => {
  if (err.message === ErrorMessages.NotFound) {
    return 404;
  }
  if (err instanceof RequestError) {
    return 400;
  }
  return 500;
};

/**
 * Provides a RESTful API for electron renderer clients on the same machine.
 */
class AdminService {
  constructor({ statusDelegate, dataDir }) {
    this.api = this.createApi();
    this.statusDelegate = statusDelegate;
    this.deviceManager = new DeviceManager(dataDir);
    this.protocolManager = new ProtocolManager(dataDir);
    this.exportManager = new ExportManager(dataDir);
    this.resolverManager = new ResolverManager(dataDir);
    this.pairingRequestService = new PairingRequestService();
    this.reportDb = this.protocolManager.reportDb;
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
    api.use(restify.plugins.queryParser());

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

    api.del('/devices/:id', (req, res, next) => {
      this.deviceManager.destroy(req.params.id)
        .then(() => res.send({ status: 'ok' }))
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error' });
        })
        .then(() => next());
    });

    api.head('/pairing_requests/:id', (req, res, next) => {
      this.pairingRequestService.checkRequest(req.params.id)
        .then((pairingRequest) => {
          if (pairingRequest) {
            const ttl = this.pairingRequestService.deviceRequestTTLSeconds * 1000;
            const expiresAt = pairingRequest.createdAt.getTime() + ttl;
            res.header('Expires', new Date(expiresAt).toJSON());
            res.send(200);
          } else {
            res.send(404);
          }
        })
        .catch((err) => {
          logger.error(err);
          res.send(500, { status: 'error', message: err.message });
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

    // "counts": { "sessions": 1, "nodes": 20, "edges": 0 }
    api.get('/protocols/:id/reports/total_counts', (req, res, next) => {
      this.reportDb.totalCounts(req.params.id)
        .then(counts => res.send({ status: 'ok', counts }))
        .then(() => next());
    });

    // "stats": { "nodes": { "min":0, "max":0, "mean":0 }, "edges": { "min":0, "max":0, "mean":0 } }
    api.get('/protocols/:id/reports/summary_stats', (req, res, next) => {
      this.reportDb.summaryStats(req.params.id)
        .then(stats => res.send({ status: 'ok', stats }))
        .then(() => next());
    });

    // nodeNames: { type1: [var1, var2], type2: [var1, var3] },
    //   edgeNames: { type1: [var1] }, egoNames: [var1, var2],
    //   egoNames: [var1, var2]
    // "buckets": {
    //      nodes: { "person": { "var1": { "val1": 0, "val2": 0 }, "var2": {} } }
    //      edges: { "friend": { "var1": { "val1": 0, "val2": 0} } }
    //      ego: { "var1": { "val1": 0 } }
    //   }
    // We use post here, instead of get, because the data is more complicated than just a list
    // of variables, it's organized by entity and type.
    api.post('/protocols/:id/reports/option_buckets', (req, res, next) => {
      const { nodeNames = '', edgeNames = '', egoNames = '' } = req.body;
      this.reportDb.optionValueBuckets(req.params.id, nodeNames, edgeNames, egoNames)
        .then(buckets => res.send({ status: 'ok', buckets }))
        .then(() => next());
    });

    // "entities": [{ time: 1546455484765, node: 20, edge: 0 }]
    api.get('/protocols/:id/reports/entity_time_series', (req, res, next) => {
      this.reportDb.entityTimeSeries(req.params.id)
        .then(({ entities, keys }) => res.send({ status: 'ok', entities, keys }))
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

    // See ExportManager#createExportFile for possible req body params
    // Handles export in a single, long-lived http request
    api.post('/protocols/:protocolId/resolve_requests', (req, res, next) => {
      apiRequestLogger('AdminAPI')(req, { statusCode: 0 }); // log request start

      let abortRequest;
      req.on('aborted', () => {
        if (abortRequest) {
          logger.debug('Resolve request aborted');
          abortRequest();
        }
      });

      req.setTimeout(0);
      res.setTimeout(0);

      this.protocolManager.getProtocol(req.params.protocolId)
        .then((protocol) => {
          const resolveRequest = this.resolverManager.resolveNetwork(protocol, req.body);
          abortRequest = resolveRequest.abort;
          return resolveRequest;
        })
        .then((result) => {
          console.log({ result });
          // TODO: Request user feedback on borderline resolutions...
          return res.send({ status: 'ok', result });
        })
        .catch((err) => {
          logger.error(err);
          res.send(codeForError(err), { status: 'error', message: err.message });
        })
        .then(() => next());
    });

    // See ExportManager#createExportFile for possible req body params
    // Handles export in a single, long-lived http request
    api.post('/protocols/:protocolId/export_requests', (req, res, next) => {
      apiRequestLogger('AdminAPI')(req, { statusCode: 0 }); // log request start

      let abortRequest;
      req.on('aborted', () => {
        if (abortRequest) {
          logger.debug('Export request aborted');
          abortRequest();
        }
      });

      req.setTimeout(0);
      res.setTimeout(0);

      this.protocolManager.getProtocol(req.params.protocolId)
        .then((protocol) => {
          const exportRequest = this.exportManager.createExportFile(protocol, req.body);
          abortRequest = exportRequest.abort;
          return exportRequest;
        })
        .then(filepath => res.send({ status: 'ok', filepath }))
        .catch((err) => {
          logger.error(err);
          res.send(codeForError(err), { status: 'error', message: err.message });
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

  resetDevices() {
    return this.deviceManager.destroyAllDevices();
  }

  resetData() {
    return Promise.all([
      resetPemKeyPair(),
      this.deviceManager.destroyAllDevices(),
      this.protocolManager.destroyAllProtocols(),
      this.protocolManager.destroyAllSessions(),
    ]);
  }
}

module.exports = {
  AdminService,
};
