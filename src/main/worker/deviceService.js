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
 * @swagger
 * definitions:
 *   Device:
 *     type: object
 *     properties:
 *       id:
 *         type: string
 *         description: UUIDv4
 *         example: a692d57c-ab0f-4aa4-8e52-565a585990da
 *       salt:
 *         type: string
 *         example: a866b6e85b17caa294093ef3454da1b0
 *         description: 32-byte hex
 */
const deviceOutputSchema = device => ({
  id: device._id,
  salt: device.salt,
});

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

    /**
     * @swagger
     * /devices/new:
     *   get:
     *     summary: Pairing Request
     *     description: Pairing Step 1.
     *         Generate a new pairing request.
     *         Responds with the request ID, and presents a pairing passcode to user (out of band).
     *         This information can be used to complete the pairing (create a device)
     *     responses:
     *       200:
     *         description: Information needed to complete the pairing request
     *         schema:
     *           type: object
     *           properties:
     *             status:
     *               type: string
     *               example: ok
     *             data:
     *               type: object
     *               properties:
     *                 pairingRequestId:
     *                   type: string
     *                   description: UUIDv4
     *                   example: b0a17a58-dc13-4270-998f-ec46a7d8edb2
     *                 salt:
     *                   type: string
     *                   example: a866b6e85b17caa294093ef3454da1b0
     *                   description: 32-byte hex
     *       400:
     *         description: request error
     *         schema:
     *           $ref: '#/definitions/Error'
     */
    api.get('/devices/new', this.handlers.onPairingRequest);

    /**
     * @swagger
     * /devices:
     *   post:
     *     summary: Pairing Confirmation
     *     description: Pairing Step 2.
     *         User has entered pairing code.
     *     parameters:
     *       - in: body
     *         schema:
     *           type: object
     *           properties:
     *             pairingRequestId:
     *               required: true
     *               type: string
     *               description: available from the 'Pairing Request' response
     *               example: b0a17a58-dc13-4270-998f-ec46a7d8edb2
     *             pairingCode:
     *               required: true
     *               type: string
     *               description: alphanumeric code entered by the user
     *               example: u8jz1M85JRAB
     *     responses:
     *       200:
     *         description: a new Device
     *         schema:
     *           type: object
     *           properties:
     *             status:
     *               type: string
     *               example: ok
     *             data:
     *               $ref: '#/definitions/Device'
     *       400:
     *         description: request error
     *         schema:
     *           $ref: '#/definitions/Error'
     */
    api.post('/devices', this.handlers.onPairingConfirm);

    /**
     * @swagger
     * /protocols:
     *   get:
     *     summary: Protocol list
     *     produces:
     *       - application/json
     *     responses:
     *       200:
     *         description: all protocols available
     *         schema:
     *           type: object
     *           properties:
     *             status:
     *               type: string
     *               example: ok
     *             data:
     *               $ref: '#/definitions/Protocol'
     *       400:
     *         description: request error
     *         schema:
     *           $ref: '#/definitions/Error'
     */
    api.get('/protocols', this.handlers.protocolList);

    /**
     * @swagger
     * /protocols/{filename}:
     *   get:
     *     summary: Protocol download
     *     description: Direct download of a zipped protocol package
     *     produces:
     *       - application/zip
     *       - application/json
     *     responses:
     *       200:
     *         description: zipped protocol (binary data).
     *                      Checksum available from /protocols endpoint
     *         schema:
     *           type: file
     *           example: "[raw data buffer]"
     *       400:
     *         description: request error
     *         schema:
     *           $ref: '#/definitions/Error'
     */
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
      /**
       * @swagger
       * definitions:
       *   Error:
       *     type: object
       *     properties:
       *       message:
       *         type: 'string'
       *         example: 'error'
       *       status:
       *         type: 'string'
       *         example: 'Human-readable description of error'
       */
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
        const pendingRequestId = req.body && req.body.pairingRequestId;
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
            res.json({ status: 'ok', data: { device: deviceOutputSchema(device) } });
          })
          .catch(err => this.handlers.onError(err, res))
          .then(next);
      },

      protocolList: (req, res, next) => {
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

  /**
   * @swagger
   * definitions:
   *   Protocol:
   *     type: object
   *     properties:
   *       name:
   *         type: string
   *       version:
   *         type: string
   *       networkCanvasVersion:
   *         type: string
   *       downloadUrl:
   *         type: string
   *       sha256:
   *         type: string
   */
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

