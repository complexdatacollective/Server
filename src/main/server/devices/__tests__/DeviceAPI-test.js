/* eslint-env jest */
const { DeviceAPI, OutOfBandDelegate } = require('../DeviceAPI');

const ProtocolManager = require('../../../data-managers/ProtocolManager');
const { jsonClient, makeUrl } = require('../../../../../config/jest/setupTestEnv');
const { ErrorMessages, RequestError } = require('../../../errors/RequestError');

const testPortNumber = 5200;
const mockSecretKey = '49b2f34ccbc425c941596fa492be0a382467538359de9ee09d42950056f0bc6a';

jest.mock('../../../data-managers/DeviceManager');
jest.mock('../../../data-managers/ProtocolManager');
jest.mock('../PairingRequestService');
jest.mock('libsodium-wrappers');
jest.mock('electron-log');

describe('the DeviceAPI', () => {
  const dataDir = '';

  describe('out-of-band IPC delegate', () => {
    let consoleError;
    beforeAll(() => {
      consoleError = global.console.error;
      global.console.error = jest.fn();
    });

    afterAll(() => {
      global.console.error = consoleError;
    });

    it('logs errors if it does not conform to protocol', () => {
      const invalidDelegate = {};
      new DeviceAPI(dataDir, invalidDelegate); // eslint-disable-line no-new
      expect(global.console.error).toHaveBeenCalledTimes(2);
      expect(global.console.error).toHaveBeenCalledWith(expect.stringContaining('pairingDidBeginWithRequest'));
      expect(global.console.error).toHaveBeenCalledWith(expect.stringContaining('pairingDidComplete'));
    });
  });

  describe('interface', () => {
    const mockRequestDbEntry = { _id: '123', salt: 'abc' };
    let deviceApi;
    const mockDelegate = new OutOfBandDelegate({
      pairingDidBeginWithRequest: jest.fn().mockReturnValue({
        promise: Promise.resolve(mockRequestDbEntry),
      }),
      pairingDidComplete: jest.fn(),
    });

    beforeEach((done) => {
      deviceApi = new DeviceAPI(dataDir, mockDelegate);
      deviceApi.listen(testPortNumber).then(() => done());
    });

    afterEach((done) => {
      deviceApi.close().then(() => done());
    });

    describe('GET /devices/new', () => {
      beforeEach(() => {
        deviceApi.requestService.createRequest.mockResolvedValue(mockRequestDbEntry);
      });

      it('responds to a client pairing request', async () => {
        const res = await jsonClient.get(makeUrl('/devices/new', deviceApi.server.url));
        expect(res.statusCode).toBe(200);
        expect(res.json.data).toHaveProperty('pairingRequestId');
        expect(res.json.data).toHaveProperty('salt');
      });
    });

    describe('POST /devices', () => {
      beforeEach(() => {
        const err = new RequestError();
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
      });
    });

    describe('GET /protocols', () => {
      const mockFilename = 'a.netcanvas';

      beforeAll(() => {
        ProtocolManager.mockImplementation(() => ({
          allProtocols: () => Promise.resolve([{ filename: mockFilename }]),
        }));
      });

      it('lists available protocols via downloadUrl', async () => {
        const res = await jsonClient.get(makeUrl('/protocols', deviceApi.server.url));
        const expectedUrl = expect.stringContaining(mockFilename);
        expect(res.statusCode).toBe(200);
        expect(res.json.data).toContainEqual({ downloadUrl: expectedUrl });
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

      it('returns file data', async () => {
        const res = await jsonClient.get(makeUrl(`/protocols/${mockFilename}`, deviceApi.server.url));
        expect(res.statusCode).toBe(200);
        // For the purposes of testing, compare string
        expect(res.json).toBeUndefined();
        expect(res.data).toEqual(mockFileContents.toString());
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
        const res = await jsonClient.post(makeUrl('/protocols/1/sessions', deviceApi.server.url), {});
        expect(res.statusCode).toBe(201);
        expect(res.json.data).toMatchObject({ insertedCount: 1 });
      });

      it('accepts multiple sessions', async () => {
        const res = await jsonClient.post(makeUrl('/protocols/1/sessions', deviceApi.server.url), [{}, {}]);
        expect(res.statusCode).toBe(201);
        expect(res.json.data).toMatchObject({ insertedCount: 2 });
      });

      it('accepts only json', async () => {
        await expect((
          jsonClient.post(makeUrl('/protocols/1/sessions', deviceApi.server.url), 'not-json')
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
          await expect(jsonClient.post(makeUrl('/protocols/1/sessions', deviceApi.server.url), {}))
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
          await expect(jsonClient.post(makeUrl('/protocols/1/sessions', deviceApi.server.url), {}))
            .rejects.toMatchObject({ statusCode: 500 });
        });
      });
    });
  });
});
