/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const logger = require('electron-log');
const PropTypes = require('prop-types');
const { URL } = require('url');

const DeviceManager = require('../../data-managers/DeviceManager');
const ProtocolManager = require('../../data-managers/ProtocolManager');
const { PairingRequestService } = require('./PairingRequestService');
const { RequestError } = require('../../errors/RequestError');

const ApiName = 'DevciceAPI';
const ApiVersion = '0.0.2';
const ApiHostName = '0.0.0.0'; // IPv4 for compatibility with Travis (& unknown installations)

const Schema = {
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
  device: device => ({
    id: device._id,
    salt: device.salt,
  }),

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
  protocol: (protocol, apiBase) => ({
    name: protocol.name,
    version: protocol.version,
    networkCanvasVersion: protocol.networkCanvasVersion,
    downloadUrl: new URL(`/protocols/${protocol.filename}`, apiBase),
    sha256: protocol.sha256,
  }),
};

// Throttle the pairing endpoints. Legitimate requests will not succeed
// at a high rate because of OOB pairing; anything else could be a timing attack.
const PairingThrottleSettings = {
  burst: 1, // concurrent requests
  rate: 0.5, // per sec, avg
  ip: true,
  overrides: {
    // Allow unlimited local requests (e.g., for testing) if needed
    '127.0.0.1': { burst: 0, rate: 0 },
  },
};

/**
 * Channel for out-of-band communications
 */
class OutOfBandDelegate {
  static get propTypes() {
    return ({
      pairingDidBeginWithCode: PropTypes.func.isRequired,
      pairingDidCompleteWithCode: PropTypes.func.isRequired,
    });
  }
  constructor({ pairingDidBeginWithCode, pairingDidCompleteWithCode }) {
    this.pairingDidBeginWithCode = pairingDidBeginWithCode;
    this.pairingDidCompleteWithCode = pairingDidCompleteWithCode;
  }
}

/**
 * API Server for device endpoints
 */
class DeviceAPI {
  constructor(dataDir, outOfBandDelegate) {
    PropTypes.checkPropTypes(OutOfBandDelegate.propTypes, outOfBandDelegate, 'prop', 'OutOfBandDelegate');
    this.requestService = new PairingRequestService();
    this.server = this.createServer();
    this.protocolManager = new ProtocolManager(dataDir);
    this.deviceManager = new DeviceManager(dataDir);
    this.outOfBandDelegate = outOfBandDelegate;
  }

  get name() { return this.server.name; }
  get url() { return this.server.url; }

  // TODO: prevent multiple?
  listen(port) {
    this.port = port;
    return new Promise((resolve) => {
      this.server.listen(port, ApiHostName, () => {
        resolve(this);
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      this.server.close(() => {
        this.port = null;
        resolve();
      });
    });
  }

  createServer() {
    const server = restify.createServer({
      name: ApiName,
      version: ApiVersion,
    });

    server.use(restify.plugins.bodyParser());

    // Whitelist everything for CORS: origins are arbitrary, and customizing client
    // Access-Origins buys no security
    const cors = corsMiddleware({ origins: ['*'] });
    server.pre(cors.preflight);
    server.use(cors.actual);

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
    server.get('/devices/new', restify.plugins.throttle(PairingThrottleSettings), this.handlers.onPairingRequest);

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
    server.post('/devices', restify.plugins.throttle(PairingThrottleSettings), this.handlers.onPairingConfirm);

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
    server.get('/protocols', this.handlers.protocolList);

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
    server.get('/protocols/:filename', this.handlers.protocolFile);

    return server;
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
        this.requestService.createRequest()
          .then((pairingRequest) => {
            // Send code up to UI
            this.outOfBandDelegate.pairingDidBeginWithCode(pairingRequest.pairingCode);
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
        this.requestService.verifyAndExpireRequest(pendingRequestId, pairingCode)
          .then(pair => this.deviceManager.createDeviceDocument(pair.salt, pair.secretKey))
          .then((device) => {
            this.outOfBandDelegate.pairingDidCompleteWithCode(pairingCode);
            res.json({ status: 'ok', data: { device: Schema.device(device) } });
          })
          .catch(err => this.handlers.onError(err, res))
          .then(next);
      },

      protocolList: (req, res, next) => {
        this.protocolManager.allProtocols()
          .then(protocols => protocols.map(p => Schema.protocol(p, this.server.url)))
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
}

module.exports = {
  default: DeviceAPI,
  DeviceAPI,
  OutOfBandDelegate,
};
