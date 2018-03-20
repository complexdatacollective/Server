/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const restify = require('restify');
const logger = require('electron-log');

const DeviceManager = require('./deviceManager');
const { PairingRequestService, PairingVerificationError } = require('./pairingRequestService');

const ApiName = 'DevciceAPI';
const ApiVersion = '0.0.1';
const DefaultPort = process.env.DEVICE_SERVICE_PORT || 51001;

const actions = {
  PAIRING_CODE_AVAILABLE: 'PAIRING_CODE_AVAILABLE',
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
    this.deviceMgr = new DeviceManager(dataDir);
  }

  start(port = DefaultPort) {
    this.port = port;
    return new Promise((resolve) => {
      this.api.listen(port, () => {
        logger.info(`${this.api.name} listening at ${this.api.url}`);
        resolve(this);
      });
    });
  }

  stop() {
    this.api.close();
    this.port = null;
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
      onPairingRequest: (req, res, next) => {
        this.reqSvc.createRequest()
          .then((pairingRequest) => {
            // Send code up to UI
            this.messageParent({
              action: actions.PAIRING_CODE_AVAILABLE,
              data: { pairingCode: pairingRequest.pairingCode },
            });
            // Respond to client
            res.send({
              status: 'ok',
              pairingRequest: {
                reqId: pairingRequest._id,
                salt: pairingRequest.salt,
              },
            });
          })
          .catch((err) => {
            logger.error(err);
            res.send(503, { status: 'error' });
          })
          .then(next);
      },

      onPairingConfirm: (req, res, next) => {
        const pendingRequestId = req.body && req.body.requestId;
        const pairingCode = req.body && req.body.pairingCode;

        // TODO: payload will actually be encrypted.
        // TODO: delete request once verified (or mark as 'used' internally)?
        // ... prevent retries/replays?
        this.reqSvc.verifyRequest(pendingRequestId, pairingCode)
          .then(pair => this.deviceMgr.createDeviceDocument(pair.salt, pair.secretKey))
          .then(device => res.send({ status: 'ok', device }))
          .catch((err) => {
            logger.error(err);
            const status = (err instanceof PairingVerificationError) ? 400 : 503;
            res.send(status, { status: 'error' });
          })
          .then(next);
      },
    };
  }
}

module.exports = {
  DeviceService,
  deviceServiceActions: actions,
};

