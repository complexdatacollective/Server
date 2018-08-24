/* eslint-env jest */
const EventEmitter = require('events');
const { InvalidCredentialsError, NotAuthorizedError } = require('restify-errors');

const ProtocolManager = require('../../../data-managers/ProtocolManager');
const { DeviceAPI } = require('../DeviceAPI');
const { jsonClient, secureClient, makeUrl, httpsCert, httpsPrivateKey } = require('../../../../../config/jest/setupTestEnv');
const { ErrorMessages, RequestError } = require('../../../errors/RequestError');
const { IncompletePairingError } = require('../../../errors/IncompletePairingError');

const testHttpPortNumber = 5200;
const testHttpsPortNumber = 5201;
const mockSecretKey = '49b2f34ccbc425c941596fa492be0a382467538359de9ee09d42950056f0bc6a';

const missingCredentialsError = new InvalidCredentialsError();
const forbiddenError = new NotAuthorizedError();

const admittingAuthenticator = (req, res, next) => next();
const missingAuthenticator = (req, res, next) => next(missingCredentialsError);
const forbiddenAuthenticator = (req, res, next) => next(forbiddenError);

jest.mock('../../../data-managers/DeviceManager');
jest.mock('../../../data-managers/ProtocolManager');
jest.mock('../PairingRequestService');
jest.mock('libsodium-wrappers');
jest.mock('electron-log');
jest.mock('../deviceAuthenticator', () => () => jest.fn());

describe('the DeviceAPI', () => {
  const dataDir = '';
  const mockRequestDbEntry = { _id: '123', salt: 'abc', pairingCode: 'abc' };
  const mockRes = { json: jest.fn() };
  const abort = jest.fn();
  let mockDelegate;
  let mockAuthenticator;
  let mockKeys;
  let deviceApi;

  beforeAll(() => {
    mockAuthenticator = admittingAuthenticator;
    mockDelegate = {
      pairingDidBeginWithRequest: jest.fn().mockReturnValue({
        promise: Promise.resolve(mockRequestDbEntry),
        abort,
      }),
      pairingDidComplete: jest.fn(),
    };
  });

  beforeEach(() => {
    // API factory: override mockAuthenticator as needed in beforeAll handler
    deviceApi = new DeviceAPI(dataDir, mockDelegate);
    deviceApi.requestService.createRequest.mockResolvedValue(mockRequestDbEntry);
  });

  afterEach(async () => {
    await deviceApi.close();
  });

  describe('error handler', () => {
    it('returns a client error when pairing fails', () => {
      const mockError = new IncompletePairingError('mock');
      deviceApi.handlers.onError(mockError, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(400, expect.objectContaining({ status: 'error' }));
    });
  });

  describe('pairing request handler', () => {
    const mockReq = new EventEmitter();
    const next = jest.fn();

    it('can be aborted', async () => {
      await deviceApi.handlers.onPairingRequest(mockReq, mockRes, next);
      expect(abort).not.toHaveBeenCalled();
      mockReq.emit('aborted');
      expect(abort).toHaveBeenCalled();
    });
  });

  describe('ssl server', () => {
    let secureApi;
    beforeEach(() => {
      secureApi = new DeviceAPI(dataDir, mockDelegate, {
        cert: httpsCert,
        private: httpsPrivateKey,
      });
    });
    it('is created when keys are supplied', () => {
      expect(secureApi.sslServer).toBeDefined();
      expect(secureApi.secureUrl).toEqual(expect.stringMatching(/^https:/));
    });
    it('makes its public key available', () => {
      expect(secureApi.publicCert).toBe(httpsCert);
    });
    it('throws if cert or key is unavailable', () => {
      expect(() => new DeviceAPI(dataDir, mockDelegate, { cert: null })).toThrowError(/SSL/);
    });
  });

  describe('interface', () => {
    beforeEach(async () => {
      deviceApi.server = deviceApi.createPairingServer();
      if (mockKeys) {
        deviceApi.sslServer = deviceApi.createSecureServer(mockAuthenticator, mockKeys);
      }
      await deviceApi.listen(testHttpPortNumber, testHttpsPortNumber);
    });

    describe('GET /devices/new', () => {
      it('responds to a client pairing request', async () => {
        const res = await jsonClient.get(makeUrl('/devices/new', deviceApi.server.url));
        expect(res.statusCode).toBe(200);
        expect(res.json.data).toHaveProperty('pairingRequestId');
        expect(res.json.data).toHaveProperty('salt');
      });

      it('notifies the gui about the pairing request', async () => {
        await jsonClient.get(makeUrl('/devices/new', deviceApi.server.url));
        expect(mockDelegate.pairingDidBeginWithRequest).toHaveBeenCalledWith(expect.objectContaining({ pairingCode: expect.stringMatching(/\w+/) }));
      });
    });

    describe('POST /devices', () => {
      beforeEach(() => {
        const err = new RequestError();
        deviceApi.requestService.createRequest.mockResolvedValue(mockRequestDbEntry);
        deviceApi.requestService.verifyAndExpireEncryptedRequest.mockRejectedValue(err);
      });

      it('rejects invalid requests', async () => {
        await expect((
          jsonClient.post(makeUrl('/devices', deviceApi.server.url), {})
        )).rejects.toHaveProperty('statusCode', 400);
      });

      it('fails when request data not found or expired', async () => {
        const reqData = { requestId: 1, pairing_code: 1 };
        await expect((
          jsonClient.post(makeUrl('/devices', deviceApi.server.url), reqData)
        )).rejects.toHaveProperty('statusCode', 400);
      });

      describe('with a valid request', () => {
        beforeEach(() => {
          // Mock that the pairing request was found & valid:
          deviceApi.requestService.verifyAndExpireEncryptedRequest.mockResolvedValue({});
          // Mock that the new device was successfully saved:
          deviceApi.deviceManager.createDeviceDocument.mockReturnValue((
            Promise.resolve({ secretKey: mockSecretKey })
          ));
        });

        it('completes a valid pairing request', async () => {
          const resp = await jsonClient.post(makeUrl('/devices', deviceApi.server.url), {
            message: 'encryptedHex',
          });
          expect(resp.statusCode).toBe(200);
          expect(resp.json.data).toHaveProperty('message');
        });

        it('notifies the gui about completion', async () => {
          await jsonClient.get(makeUrl('/devices/new', deviceApi.server.url));
          expect(mockDelegate.pairingDidComplete).toHaveBeenCalled();
        });
      });
    });

    describe('GET /protocols', () => {
      const mockFilename = 'a.netcanvas';

      beforeAll(() => {
        mockKeys = {
          cert: httpsCert,
          private: httpsPrivateKey,
        };
        ProtocolManager.mockImplementation(() => ({
          allProtocols: () => Promise.resolve([{ filename: mockFilename }]),
        }));
      });

      it('lists available protocol download paths', async () => {
        const res = await secureClient.get(makeUrl('/protocols', deviceApi.sslServer.url));
        expect(res.statusCode).toBe(200);
        expect(res.json.data).toContainEqual({ downloadPath: `/protocols/${mockFilename}` });
      });

      it('is not available over http', async () => {
        await expect(jsonClient.get(makeUrl('/protocols', deviceApi.server.url)))
          .rejects.toMatchObject({ statusCode: 404 });
      });
    });

    describe('GET /protocols/:filename', () => {
      const mockFilename = 'a.netcanvas';
      const mockFileContents = Buffer.from(['a'.charCodeAt()]);
      beforeAll(() => {
        ProtocolManager.mockImplementation(() => ({
          fileContents: jest.fn().mockResolvedValue(mockFileContents),
        }));
      });

      it('returns file data securely', async () => {
        const res = await secureClient.get(makeUrl(`/protocols/${mockFilename}`, deviceApi.sslServer.url));
        expect(res.statusCode).toBe(200);
        // For the purposes of testing, compare string
        expect(res.json).toBeUndefined();
        expect(res.data).toEqual(mockFileContents.toString());
      });

      it('will not return file data over http', async () => {
        await expect(jsonClient.get(makeUrl(`/protocols/${mockFilename}`, deviceApi.server.url)))
          .rejects.toMatchObject({ statusCode: 404 });
      });

      describe('when not found', () => {
        beforeAll(() => {
          ProtocolManager.mockImplementation(() => ({
            fileContents: jest.fn().mockRejectedValue(new RequestError(ErrorMessages.NotFound)),
          }));
        });

        it('rejects with 404', async () => {
          await expect(jsonClient.get(makeUrl('/protocols/doesnotexist.netcanvas', deviceApi.server.url), {}))
            .rejects.toMatchObject({ statusCode: 404 });
        });
      });
    });

    describe('POST /protocols/:protocolId/sessions', () => {
      beforeAll(() => {
        ProtocolManager.mockImplementation(() => ({
          addSessionData: jest.fn().mockImplementation((_, session) => (
            Promise.resolve((session instanceof Array) ? session : [session])
          )),
        }));
      });

      it('returns created status', async () => {
        const res = await secureClient.post(makeUrl('/protocols/1/sessions', deviceApi.sslServer.url), {});
        expect(res.statusCode).toBe(201);
        expect(res.json.data).toMatchObject({ insertedCount: 1 });
      });

      it('is not available over http', async () => {
        await expect(jsonClient.post(makeUrl('/protocols/1/sessions', deviceApi.server.url), {}))
          .rejects.toMatchObject({ statusCode: 404 });
      });

      it('accepts multiple sessions', async () => {
        const res = await secureClient.post(makeUrl('/protocols/1/sessions', deviceApi.sslServer.url), [{}, {}]);
        expect(res.statusCode).toBe(201);
        expect(res.json.data).toMatchObject({ insertedCount: 2 });
      });

      it('accepts only json', async () => {
        await expect((
          secureClient.post(makeUrl('/protocols/1/sessions', deviceApi.sslServer.url), 'not-json')
        )).rejects.toHaveProperty('statusCode', 406);
      });

      describe('when session already exists', () => {
        beforeAll(() => {
          const dbErr = new Error('nedb error');
          dbErr.errorType = 'uniqueViolated';
          ProtocolManager.mockImplementation(() => ({
            addSessionData: jest.fn().mockRejectedValue(dbErr),
          }));
        });

        it('rejects with a conflict', async () => {
          await expect(secureClient.post(makeUrl('/protocols/1/sessions', deviceApi.sslServer.url), {}))
            .rejects.toMatchObject({ statusCode: 409 });
        });
      });

      describe('when there’s another type of server error', () => {
        beforeAll(() => {
          ProtocolManager.mockImplementation(() => ({
            addSessionData: jest.fn().mockRejectedValue(new Error('unexpected error')),
          }));
        });

        it('rejects with an unknown server error', async () => {
          await expect(secureClient.post(makeUrl('/protocols/1/sessions', deviceApi.sslServer.url), {}))
            .rejects.toMatchObject({ statusCode: 500 });
        });
      });
    });

    describe('when missing credentials', () => {
      beforeAll(() => {
        mockAuthenticator = missingAuthenticator;
        ProtocolManager.mockImplementation(() => ({
          allProtocols: jest.fn(),
        }));
      });

      it('cannot access protocols', async () => {
        await expect(secureClient.get(makeUrl('/protocols', deviceApi.sslServer.url)))
          .rejects.toMatchObject({ statusCode: 401 });
        expect(deviceApi.protocolManager.allProtocols).not.toHaveBeenCalled();
      });
    });

    describe('when credentials are invalid', () => {
      beforeAll(() => {
        mockAuthenticator = forbiddenAuthenticator;
        ProtocolManager.mockImplementation(() => ({
          allProtocols: jest.fn(),
        }));
      });

      it('cannot access protocols', async () => {
        await expect(secureClient.get(makeUrl('/protocols', deviceApi.sslServer.url)))
          .rejects.toMatchObject({ statusCode: 403 });
        expect(deviceApi.protocolManager.allProtocols).not.toHaveBeenCalled();
      });
    });
  });
});
