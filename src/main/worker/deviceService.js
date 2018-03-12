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
    const reqSvc = new DeviceRequestService();
    this.api = this.createApi(reqSvc);
  }

  start() {
    this.api.listen(DefaultPort, () => {
      logger.info(`${this.api.name} listening at ${this.api.url}`);
    });
  }

  stop() {
    this.api.close();
  }

  createApi(reqSvc) {
    const api = restify.createServer({
      name: ApiName,
      version: ApiVersion,
    });;

    api.use(restify.plugins.bodyParser());

    // Pairing Step 1. Generate a new pairing request.
    // Send request ID in response; present pairing passcode to user (out of band).
    api.get('/devices/new', (req, res, next) => {
      reqSvc.createRequest()
        .then((pairRequest) => {
          // Send code up to UI
          process.send({
            action: actions.PAIRING_CODE_AVAILABLE,
            data: { code: pairRequest.pairingCode }
          });
          // Respond to client
          res.send({
            status: 'ok',
            pairRequest: {
              reqId: pairRequest._id,
              salt: pairRequest.salt,
            }
          });
        })
        .catch((err) => {
          logger.error(err);
          res.send(503, { status: 'error' });
        })
        .then(next);
    });

    // Pairing Step 2.
    // User has entered pairing code
    api.post('/devices', (req, res, next) => {
      const pendingRequestId = req.body.request_id;
      const pairingCode = req.body.pairing_code;
      // TODO: payload will actually be encrypted.
      reqSvc.verifyRequest(pendingRequestId, pairingCode)
        .then(() => {
          // TODO: Create/save device.
          // TODO: delete request once verified (or mark as 'used' internally)?
          // ... prevent retries/replays?
          res.send({ status: 'ok' });
        })
        .catch((err) => {
          logger.error(err);
          res.send(503, { status: 'error' });
        })
        .then(next);
    });

    return api;
  }
}

module.exports = {
  DeviceService,
  deviceServiceActions: actions,
};

