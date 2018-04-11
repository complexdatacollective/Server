/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const restify = require('restify');
const logger = require('electron-log');
const { URL } = require('url');

const DeviceManager = require('../data-managers/DeviceManager');
const ProtocolManager = require('../data-managers/ProtocolManager');
const { RequestError } = require('../errors/RequestError');
const { PairingRequestService } = require('./pairingRequestService');

const ApiName = 'DevciceAPI';
const ApiVersion = '0.0.2';
const DefaultPort = process.env.DEVICE_SERVICE_PORT || 51001;

const actions = {
  PAIRING_CODE_AVAILABLE: 'PAIRING_CODE_AVAILABLE',
  PAIRING_COMPLETE: 'PAIRING_COMPLETE',
};

/**
 * @memberof BackgroundServices
 * @class DeviceService
 * Provides APIs for external client devices running
 * [Network Canvas]{@link https://github.com/codaco/Network-Canvas}.
 *
 * Services:
 * - Device Pairing
 */
class DeviceService {
  constructor({ dataDir }) {
    this.reqSvc = new PairingRequestService();
    this.api = this.createApi();
    this.deviceManager = new DeviceManager(dataDir);
    this.protocolManager = new ProtocolManager(dataDir);
  }

  start(port = DefaultPort) {
    this.port = port;
    return new Promise((resolve) => {
      this.api.listen(port, '0.0.0.0', () => {
        logger.info(`${this.api.name} listening at ${this.api.url}`);
        resolve(this);
      });
    });
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
      version: ApiVersion,
    });

    api.use(restify.plugins.bodyParser());

    // Pairing Step 1. Generate a new pairing request.
    // Send request ID in response; present pairing passcode to user (out of band).
    api.get('/devices/new', this.handlers.onPairingRequest);

    // Pairing Step 2.
    // User has entered pairing code
    api.post('/devices', this.handlers.onPairingConfirm);

    api.get('/protocols', this.handlers.protocolList);

    api.get('/protocols/:filename', this.handlers.protocolFile);

    return api;
  }

  // eslint-disable-next-line class-methods-use-this
  messageParent(data) {
    if (process.send) {
      process.send(data);
    } else {
      logger.error('No parent available for IPC');
    }
  }

  get handlers() {
    return {
      // Secondary handler for error cases in req/res chain
      onError: (err, res) => {
        if (err instanceof RequestError) {
          res.json(400, { status: 'error', message: err.message });
        } else {
          logger.error(err);
          res.json(500, { status: 'error', message: 'Unknown Server Error' });
        }
      },

      onPairingRequest: (req, res, next) => {
        this.reqSvc.createRequest()
          .then((pairingRequest) => {
            // Send code up to UI
            this.messageParent({
              action: actions.PAIRING_CODE_AVAILABLE,
              data: { pairingCode: pairingRequest.pairingCode },
            });
            // Respond to client
            res.json({
              status: 'ok',
              data: {
                pairingRequestId: pairingRequest._id,
                salt: pairingRequest.salt,
              },
            });
          })
          .catch(err => this.handlers.onError(err, res))
          .then(next);
      },

      onPairingConfirm: (req, res, next) => {
        const pendingRequestId = req.body && req.body.requestId;
        const pairingCode = req.body && req.body.pairingCode;

        // TODO: payload will actually be encrypted.
        // TODO: delete request once verified (or mark as 'used' internally)?
        // ... prevent retries/replays?
        this.reqSvc.verifyRequest(pendingRequestId, pairingCode)
          .then(pair => this.deviceManager.createDeviceDocument(pair.salt, pair.secretKey))
          .then((device) => {
            this.messageParent({
              action: actions.PAIRING_COMPLETE,
              data: { pairingCode },
            });
            res.json({ status: 'ok', device });
          })
          .catch(err => this.handlers.onError(err, res))
          .then(next);
      },

      protocolList: (req, res, next) => {
        // TODO: return metadata (see #60) incl. checksums (protocolFile returns
        // raw contents to match existing client behavior)
        this.protocolManager.allProtocols()
          .then(protocols => protocols.map(p => this.protocolOutputSchema(p)))
          .then(schemas => res.json({ status: 'ok', data: schemas }))
          .catch(err => this.handlers.onError(err, res))
          .then(next);
      },

      protocolFile: (req, res, next) => {
        this.protocolManager.fileContents(req.params.filename)
          .then((fileBuf) => {
            res.header('content-type', 'application/zip');
            res.send(fileBuf);
          })
          .catch(err => this.handlers.onError(err, res))
          .then(next);
      },
    };
  }

  protocolOutputSchema(protocol) {
    return {
      name: protocol.name,
      version: protocol.version,
      networkCanvasVersion: protocol.networkCanvasVersion,
      downloadUrl: new URL(`/protocols/${protocol.filename}`, this.api.url),
      sha256: protocol.sha256,
    };
  }
}

module.exports = {
  DeviceService,
  deviceServiceActions: actions,
};

