const restify = require('restify');
const logger = require('electron-log');

const DeviceRequestService = require('./pairingRequestService');

const ApiName = 'DevciceAPI';
const ApiVersion = '0.0.1';
const DefaultPort = 51001;

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
  constructor(/* { dataDir } */) {
    this.reqSvc = new DeviceRequestService();
    this.api = this.createApi();
  }

  start(port = DefaultPort) {
    return new Promise((resolve, reject) => {
      this.api.listen(port, () => {
        logger.info(`${this.api.name} listening at ${this.api.url}`);
        resolve(this);
      });
    });
  }

  stop() {
    this.api.close();
  }

  createApi() {
    const api = restify.createServer({
      name: ApiName,
      version: ApiVersion,
    });;

    api.use(restify.plugins.bodyParser());

    // Pairing Step 1. Generate a new pairing request.
    // Send request ID in response; present pairing passcode to user (out of band).
    api.get('/devices/new', this.handlers.onPairingRequest);

    // Pairing Step 2.
    // User has entered pairing code
    api.post('/devices', this.handlers.onPairingConfirm);

    return api;
  }

  messageParent (data) {
    if (process.send) {
      process.send(data);
    } else {
      logger.error('No parent available for IPC');
    }
  }

  get handlers () {
    return {
      onPairingRequest: (req, res, next) => {
        this.reqSvc.createRequest()
          .then((pairingRequest) => {
            // Send code up to UI
            this.messageParent({
              action: actions.PAIRING_CODE_AVAILABLE,
              data: { pairingCode: pairingRequest.pairingCode }
            });
            // Respond to client
            res.send({
              status: 'ok',
              pairingRequest: {
                reqId: pairingRequest._id,
                salt: pairingRequest.salt,
              }
            });
          })
          .catch((err) => {
            logger.error(err);
            res.send(503, { status: 'error' });
          })
          .then(next)
      },

      onPairingConfirm: (req, res, next) => {
        const pendingRequestId = req.body && req.body.requestId;
        const pairingCode = req.body && req.body.pairingCode;
        if (!pendingRequestId || !pairingCode) {
          res.send(400, { status: 'error' });
          return next();
        }

        // TODO: payload will actually be encrypted.
        this.reqSvc.verifyRequest(pendingRequestId, pairingCode)
          .then(() => {
            // TODO: Create/save device.
            // TODO: delete request once verified (or mark as 'used' internally)?
            // ... prevent retries/replays?
            res.send({ status: 'ok' });
          })
          .catch((err) => {
            logger.error(err);
            res.send(400, { status: 'error' });
          })
          .then(next);
      }
    }
  };

}

module.exports = {
  DeviceService,
  deviceServiceActions: actions,
};

