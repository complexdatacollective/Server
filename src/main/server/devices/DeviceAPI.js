/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
/* eslint max-len: ["error", { "code":100, "ignoreComments": true }] */
const os = require('os');
const restify = require('restify');
const corsMiddleware = require('restify-cors-middleware');
const logger = require('electron-log');
const { ConflictError, NotAcceptableError } = require('restify-errors');
const { EventEmitter } = require('events');
const { sendToGui } = require('../../guiProxy');

const DeviceManager = require('../../data-managers/DeviceManager');
const ProtocolManager = require('../../data-managers/ProtocolManager');
const apiRequestLogger = require('../apiRequestLogger');
const deviceAuthenticator = require('./deviceAuthenticator');
const { PairingRequestService } = require('./PairingRequestService');
const { ErrorMessages, RequestError } = require('../../errors/RequestError');
const { IncompletePairingError } = require('../../errors/IncompletePairingError');
const { encrypt } = require('../../utils/shared-api/cipher');

// TODO: remove dupe from Server
const lanIP = () => {
  const interfaces = Object.values(os.networkInterfaces());
  const lanV4 = val => val.family === 'IPv4' && val.internal === false;
  const iface = [].concat(...interfaces).find(lanV4);
  return iface && iface.address;
};

/**
 * @swagger
 * security:
 *   - Device Identification
 * securityDefinitions:
 *   Device Identification:
 *     type: basic
 *     description: |
 *       For all paired endpoints. Pass the client's deviceId as the username. See [Device](#/definitions/Device).
 *       All paired endpoints exist under the https server.
 *
 *       Example:
 *       ```
 *       # Given a deviceId `5b1ac0e7-c896-405f-bab0-8b778ab1b6eb`:
 *       Authorization: Basic NWIxYWMwZTctYzg5Ni00MDVmLWJhYjAtOGI3NzhhYjFiNmViOg==
 *       ```
 *
 *       For the pairing protocol (`GET /devices/new`, `POST `/devices`), no deviceId is required (nor available).
 */
const ApiName = 'DeviceAPI';
const ApiVersion = '0.0.14';
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
   *         description: 32-byte hex
   *         example: a866b6e85b17caa294093ef3454da1b0
   *       name:
   *         type: string
   *         description: Name provided by the device during pairing confirmation
   *         example: Nexus 7 Tablet
   */
  device: device => ({
    id: device._id,
    salt: device.salt,
    name: device.name,
  }),

  /**
   * @swagger
   * definitions:
   *   Protocol:
   *     type: object
   *     properties:
   *       id:
   *         type: string
   *         format: hex
   *         description: |
   *           A digest of the protocol name, serving as a unique identifier for this protocol
   *           across server instances.
   *           May be used for other endpoints (such as data import).
   *         example: b40bdb458541a852d517daf1b3b7c7eb038b73f4f04ec867a253e76bdef5452b
   *       name:
   *         type: string
   *         description: Unique protocol name as defined in protocol.json
   *         example: Example Protocol
   *       description:
   *         type: string
   *         required: false
   *         example: Version 2 - internal
   *       lastModified:
   *         required: false
   *         type: datetime
   *         description: Modification date of the protocol, as defined in protocol.json
   *         example: 2018-01-01T12:00:00.000Z
   *       networkCanvasVersion:
   *         type: string
   *         description: Version as defined in protocol.json
   *         example: "~4.0.0"
   *       downloadPath:
   *         type: string
   *         description: URL for direct download of the .netcanvas file from this server.|
   *           Protocol downloads must use the https service.
   *         example: /protocols/foo.netcanvas
   *       sha256Digest:
   *         type: string
   *         example: 8f99051c91044bd8159a8cc0fa2aaa831961c4428ce1859b82612743c9720eef
   */
  protocol: protocol => ({
    id: protocol._id,
    name: protocol.name,
    description: protocol.description,
    lastModified: protocol.lastModified,
    networkCanvasVersion: protocol.networkCanvasVersion,
    downloadPath: `/protocols/${protocol.filename}`,
    sha256Digest: protocol.sha256Digest,
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
 * @swagger
 * definitions:
 *   Error:
 *     type: object
 *     properties:
 *       message:
 *         type: 'string'
 *         example: 'Human-readable description of error'
 *       status:
 *         type: 'string'
 *         example: 'error'
 */
const buildErrorResponse = (err, res) => {
  const body = { status: 'error', message: err.message || 'Unknown Error' };
  let statusCode;
  if (err instanceof RequestError) {
    const is404 = err.message === ErrorMessages.NotFound;
    statusCode = is404 ? 404 : 400;
  } else if (err instanceof IncompletePairingError) {
    // TODO: review; 5xx is probably correct, but weird bc of user involvement
    statusCode = 400;
  } else if (!err.statusCode) {
    logger.error(err);
    body.message = 'Unknown Server Error';
    statusCode = 500;
  }
  res.json(err.statusCode || statusCode, body);
};

// TODO: handle all error responses here instead of buildErrorResponse
const handleApiError = (req, res, err, callback) => {
  logger.debug('handleApiError', err, req.headers);
  err.toJSON = () => ({ // eslint-disable-line no-param-reassign
    status: 'error',
    message: err.message || err.name,
  });
  return callback();
};

const requireJsonRequest = (req, res, next) => {
  if (req.header('content-type') !== 'application/json') {
    buildErrorResponse(new NotAcceptableError('content-type must be "application/json"'), res);
    next(false);
    return false;
  }
  return true;
};

const emittedEvents = {
  SESSIONS_IMPORTED: 'SESSIONS_IMPORTED',
};

// Any https routes not requiring auth can go here
const publicRoutes = [];

const createBaseServer = (opts = {}) => {
  const serverOpts = {
    name: ApiName,
    onceNext: true,
    version: ApiVersion,
    ...opts,
  };

  const server = restify.createServer(serverOpts);
  server.pre(restify.plugins.pre.sanitizePath());
  server.pre(restify.plugins.authorizationParser());
  server.use(restify.plugins.bodyParser());
  server.on('restifyError', handleApiError);

  if (process.env.NODE_ENV === 'development') {
    server.on('after', apiRequestLogger(opts.logTag || 'DeviceAPI'));
  }

  // Whitelist everything for CORS: origins are arbitrary, and customizing client
  // Access-Origins buys no security
  const cors = corsMiddleware({
    origins: ['*'],
    allowHeaders: ['Authorization'],
  });
  server.pre(cors.preflight);
  server.use(cors.actual);

  return server;
};

/**
 * API Server for device endpoints
 */
class DeviceAPI extends EventEmitter {
  constructor(dataDir, outOfBandDelegate, keys) {
    super();
    this.requestService = new PairingRequestService();
    this.protocolManager = new ProtocolManager(dataDir);
    this.deviceManager = new DeviceManager(dataDir);

    const authenticator = deviceAuthenticator(this.deviceManager, publicRoutes);
    this.server = this.createPairingServer();
    this.sslServer = keys && this.createSecureServer(authenticator, keys);
    this.outOfBandDelegate = outOfBandDelegate;
    this.publicCert = keys && keys.cert;
  }

  get name() { return this.server.name; }
  get httpBase() { return this.server.url.replace(ApiHostName, lanIP()); }
  get httpsBase() { return this.secureUrl.replace(ApiHostName, lanIP()); }
  get url() { return this.server.url; }
  get secureUrl() { return this.sslServer && this.sslServer.url; }

  // TODO: prevent multiple?
  listen(httpPort, httpsPort) {
    this.httpPort = httpPort;
    const promises = [
      new Promise((resolve) => {
        this.server.listen(httpPort, ApiHostName, () => {
          resolve();
        });
      }),
    ];
    if (httpsPort && this.sslServer) {
      promises.push(new Promise((resolve) => {
        this.sslServer.listen(httpsPort, ApiHostName, () => {
          resolve();
        });
      }));
    }
    return Promise.all(promises).then(() => this);
  }

  close() {
    const promises = [new Promise((resolve) => {
      this.server.close(() => {
        this.httpPort = null;
        resolve();
      });
    })];
    if (this.sslServer) {
      promises.push(new Promise((resolve) => {
        this.sslServer.close(() => { resolve(); });
      }));
    }
    return Promise.all(promises);
  }

  createPairingServer() {
    const server = createBaseServer();

    /**
     * @swagger
     * /devices/new:
     *   get:
     *     summary: Pairing Request
     *     description: |
     *         Pairing Step 1. Generate a new pairing request.
     *
     *         Responds with the request ID, and presents a pairing passcode to user (out of band).
     *         This information can be used to complete the pairing (create a device).
     *
     *         A response is not sent until the user takes action (via the GUI), or the request
     *         times out; the connection is intended to be open for an extended period of time.
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
     *                   format: uuid
     *                   description: UUIDv4
     *                   example: b0a17a58-dc13-4270-998f-ec46a7d8edb2
     *                 salt:
     *                   type: string
     *                   format: hexadecimal
     *                   example: a866b6e85b17caa294093ef3454da1b0
     *                   description: 32-byte hex
     *       400:
     *         description: request error
     *         schema:
     *           $ref: '#/definitions/Error'
     */
    server.get('/devices/new',
      restify.plugins.throttle(PairingThrottleSettings), this.handlers.onPairingRequest);

    /**
     * @swagger
     * /devices:
     *   post:
     *     summary: Pairing Confirmation
     *     description: Pairing Step 2.
     *         User has entered pairing code.
     *     consumes:
     *       - application/json
     *     parameters:
     *       - in: body
     *         schema:
     *           type: object
     *           properties:
     *             message:
     *               required: true
     *               type: string
     *               format: hexadecimal
     *               description: |
     *                 The nonce + message payload, encrypted with a client-generated secret.
     *
     *                 This message is a hex encoding of the concatenation of two byte arrays:
     *                 1. Nonce: a 24-byte nonce (not re-used) chosen by the client
     *                 2. Ciphertext: the message, encrypted with secret key and nonce.
     *
     *                 For the message format before encryption, see
     *                 [DecryptedPairingConfirmationRequest](#/definitions/DecryptedPairingConfirmationRequest).
     *
     *                 To encrypt the JSON payload above, use `encrypt` from the [secure-comms-api](https://github.com/codaco/secure-comms-api/blob/master/cipher.js).
     *
     *                 Interally, `encrypt` uses [libsodium](https://download.libsodium.org/doc/) to:
     *                 1. Derive a secret key from (1) the out-of-band pairing code, and (2) the salt returned from `/devices/new`
     *                 2. Generate a nonce
     *                 3. Call the [secretbox_easy API](https://download.libsodium.org/doc/secret-key_cryptography/authenticated_encryption.html) for authenticated encryption
     *
     *                 The nonce must be additionally sent in plaintext in order to decrypt the message. The server can reconstruct the secret from previous knowledge about the salt and pairing code.
     *
     *     responses:
     *       200:
     *         description: new Device information (encrypted)
     *         schema:
     *           type: object
     *           properties:
     *             status:
     *               type: string
     *               example: ok
     *             message:
     *               required: true
     *               type: string
     *               format: hexadecimal
     *               description: |
     *                 The nonce + message payload.
     *
     *                 As in the request, the message is a hex encoding of nonce + ciphertext.
     *
     *                 For the message format after decryption, see [DecryptedPairingConfirmationResponse](#/definitions/DecryptedPairingConfirmationResponse).
     *       400:
     *         description: request error
     *         schema:
     *           $ref: '#/definitions/Error'
     *
     * definitions:
     *   DecryptedPairingConfirmationRequest:
     *     type: object
     *     properties:
     *       pairingRequestId:
     *         required: true
     *         type: string
     *         description: available from the 'Pairing Request' response
     *         example: b0a17a58-dc13-4270-998f-ec46a7d8edb2
     *       pairingCode:
     *         required: true
     *         type: string
     *         description: alphanumeric code entered by the user
     *         example: u8jz1M85JRAB
     *       deviceName:
     *         required: false
     *         type: string
     *         description: A short, user-friendly description of the client device
     *         example: Nexus 7 Tablet
     *
     *   DecryptedPairingConfirmationResponse:
     *     type: object
     *     properties:
     *       device:
     *         $ref: '#/definitions/Device'
     *       certificate:
     *         type: string
     *         description: A PEM-formatted public certificate.
     *         example: "-----BEGIN CERTIFICATE-----\nMIIDBjCCA..."
     *       securePort:
     *         type: string
     *         description: Port number to use when making HTTPS requests. |
     *           The HTTPS service runs on a different port than the pairing (HTTP) service.
     *         example: 51002
     */
    server.post('/devices',
      restify.plugins.throttle(PairingThrottleSettings), this.handlers.onPairingConfirm);

    return server;
  }

  createSecureServer(authenticatorPlugin, keys) {
    if (!keys.cert || !keys.private) {
      throw new Error('SSL server requires a certificate & key');
    }
    const server = createBaseServer({
      certificate: keys.cert,
      key: keys.private,
      logTag: 'SecureDeviceAPI',
    });

    server.use(authenticatorPlugin);
    server.use(restify.plugins.gzipResponse());

    /**
     * @swagger
     * /protocols:
     *   get:
     *     summary: Protocol list
     *     description: Provides metadata about all protocols available from this server
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
     *               type: array
     *               items:
     *                 $ref: '#/definitions/Protocol'
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
     *       404:
     *         description: Not found
     *         schema:
     *           $ref: '#/definitions/Error'
     */
    server.get('/protocols/:filename', this.handlers.protocolFile);

    /**
     * @swagger
     * /protocols/{protocolId}/sessions:
     *   post:
     *     summary: Upload session
     *     description: |
     *       Import session (interview) data.
     *
     *       - You may upload one or more session objects at a time.
     *       - Each session object must include a `uuid` property that uniquely identifies the session
     *       - Inserts are all-or-nothing:
     *           + If any session fails to save (e.g., because of duplicate IDs), then no insert succeeds.
     *           + Likewise, a successful response means that all sessions have been saved
     *     consumes:
     *       - application/json
     *     parameters:
     *       - name: protocolId
     *         in: path
     *         type: string
     *         required: true
     *         description: |
     *           This unique ID must point to a protocol that already exists in server.
     *           This ID can be obtained from the response to `/protocols`.
     *       - in: body
     *         description: |
     *           One or more sessions to import.
     *         schema:
     *           type: object
     *           description: A single session containing its produced network data
     *           properties:
     *             uuid:
     *               required: true
     *               type: string
     *               format: uuid
     *               description: a cryptographically-strong, globally unique identifier (required)
     *               example: 2a02fccc-10ec-4bf9-9a7a-d156e3858fb6
     *             data:
     *               type: object
     *               description: |
     *                 The primary data generated by the session.
     *
     *                 This may be of any shape, though likely contains the network data.
     *                 The presence of "nodes" and "edges" properties allows Server to automatically provide some reporting.
     *               properties:
     *                 nodes:
     *                   required: false
     *                   type: array
     *                   description: An array of arbitrary objects that may be used for reporting if present
     *                   example: []
     *                 edges:
     *                   required: false
     *                   type: array
     *                   description: An array of arbitrary objects that may be used for reporting if present
     *                   example: []
     *     produces:
     *       - application/json
     *     responses:
     *       201:
     *         description: Upload confirmation
     *         schema:
     *           type: object
     *           properties:
     *             status:
     *               type: string
     *               example: ok
     *             data:
     *               type: object
     *               properties:
     *                 totalCount:
     *                   type: number
     *                   description: The count of uploaded sessions
     *                   example: 10
     *       400:
     *         description: Generic request error
     *         schema:
     *           $ref: '#/definitions/Error'
     *       404:
     *         description: Protocol was not found
     *         schema:
     *           $ref: '#/definitions/Error'
     *       406:
     *         description: Request did not not contain valid JSON
     *         schema:
     *           $ref: '#/definitions/Error'
     *       409:
     *         description: A session with the requested ID has already been created (Conflict)
     *         schema:
     *           $ref: '#/definitions/Error'
     *
     */
    server.post('/protocols/:id/sessions', this.handlers.uploadSessions);

    return server;
  }

  get handlers() {
    return {
      // Secondary handler for error cases in req/res chain
      onError: buildErrorResponse,

      onPairingRequest: (req, res, next) => {
        let abortRequest;
        req.on('aborted', () => {
          if (abortRequest) { abortRequest(); }
        });

        this.requestService.createRequest()
          .then((pairingRequest) => {
            // Send code up to UI, and wait for user response
            const ack = this.outOfBandDelegate.pairingDidBeginWithRequest(pairingRequest);
            // Provide hook to abort from client-side
            abortRequest = ack.abort;
            return ack.promise;
          })
          .then((ackedPairingRequest) => {
            // Respond to client
            res.json({
              status: 'ok',
              data: {
                pairingRequestId: ackedPairingRequest._id,
                salt: ackedPairingRequest.salt,
              },
            });
          })
          .catch(err => this.handlers.onError(err, res))
          .then(() => next());
      },

      onPairingConfirm: (req, res, next) => {
        const encryptedMsg = req.body && req.body.message;
        this.requestService.verifyAndExpireEncryptedRequest(encryptedMsg)
          .then(pairingRequest => (
            this.deviceManager.createDeviceDocument(
              pairingRequest.secretKey,
              pairingRequest.deviceName,
            )
          ))
          .then((device) => {
            // TODO: if responding with error, surface error instead of complete
            this.outOfBandDelegate.pairingDidComplete();
            const secureAddr = this.sslServer && this.sslServer.address();
            const payload = JSON.stringify({
              device: Schema.device(device),
              certificate: this.publicCert,
              securePort: secureAddr && secureAddr.port,
            });
            res.json({ status: 'ok', data: { message: encrypt(payload, device.secretKey) } });
          })
          .catch(err => this.handlers.onError(err, res))
          .then(() => next());
      },

      protocolList: (req, res, next) => {
        this.protocolManager.allProtocols()
          .then(protocols => protocols.map(p => Schema.protocol(p, this.httpBase, this.httpsBase)))
          .then(schemas => res.json({ status: 'ok', data: schemas }))
          .catch(err => this.handlers.onError(err, res))
          .then(() => next());
      },

      protocolFile: (req, res, next) => {
        this.protocolManager.fileContents(req.params.filename)
          .then((fileBuf) => {
            res.header('content-type', 'application/zip');
            res.send(fileBuf);
          })
          .catch(err => this.handlers.onError(err, res))
          .then(() => next());
      },

      uploadSessions: (req, res, next) => {
        if (!requireJsonRequest(req, res, next)) {
          return;
        }

        const sessionData = req.body;
        const protocolId = req.params.id;
        this.protocolManager.addSessionData(protocolId, sessionData)
          .then((docs) => {
            res.json(201, { status: 'ok', data: { insertedCount: docs.length } });
            return docs;
          })
          .then(docs => sendToGui(emittedEvents.SESSIONS_IMPORTED, docs))
          .catch((err) => {
            if (err.errorType === 'uniqueViolated') { // from nedb
              this.handlers.onError(new ConflictError(err.message), res);
            } else {
              this.handlers.onError(err, res);
            }
          })
          .then(() => next());
      },
    };
  }
}

module.exports = {
  default: DeviceAPI,
  ApiVersion,
  DeviceAPI,
  apiEvents: emittedEvents,
};
