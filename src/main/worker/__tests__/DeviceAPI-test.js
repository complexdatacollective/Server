/* eslint-env jest */
const { DeviceAPI, OutOfBandDelegate } = require('../DeviceAPI');

const ProtocolManager = require('../../data-managers/ProtocolManager');
const { jsonClient, makeUrl } = require('../../../setupTests');
const { RequestError } = require('../../errors/RequestError');

const testPortNumber = 5200;

jest.mock('../../data-managers/DeviceManager');
jest.mock('../../data-managers/ProtocolManager');
jest.mock('../pairingRequestService');

describe('the DeviceAPI', () => {
  const dataDir = '';
  // let mockPairingDbRecord;
  // const send = 'json'; // the send method used in restify response handlers

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
      expect(global.console.error).toHaveBeenCalledWith(expect.stringContaining('pairingDidBeginWithCode'));
      expect(global.console.error).toHaveBeenCalledWith(expect.stringContaining('pairingDidCompleteWithCode'));
    });
  });

  describe('interface', () => {
    let deviceApi;
    const mockDelegate = new OutOfBandDelegate({
      pairingDidBeginWithCode: jest.fn(),
      pairingDidCompleteWithCode: jest.fn(),
    });

    beforeEach((done) => {
      deviceApi = new DeviceAPI(dataDir, mockDelegate);
      deviceApi.listen(testPortNumber).then(done);
    });

    afterEach((done) => {
      deviceApi.close().then(done);
    });

    describe('GET /devices/new', () => {
      const mockRequestDbEntry = { _id: '123', salt: 'abc' };
      beforeEach(() => {
        deviceApi.requestService.createRequest.mockReturnValue(Promise.resolve(mockRequestDbEntry));
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
        // Note: mockReturnValue(Promise.reject(...))  triggers UnhandledPromiseRejectionWarning
        deviceApi.requestService.verifyRequest.mockImplementation(() => (
          Promise.reject(new RequestError())
        ));
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
          deviceApi.requestService.verifyRequest.mockReturnValue(Promise.resolve({}));
          // Mock that the new device was successfully saved:
          deviceApi.deviceManager.createDeviceDocument.mockReturnValue(Promise.resolve({}));
        });

        it('completes a valid pairing request', async () => {
          const resp = await jsonClient.post(makeUrl('/devices', deviceApi.server.url), {
            pairingRequestId: '1',
            pairingCode: '12345',
          });
          expect(resp.statusCode).toBe(200);
          expect(resp.json.data).toHaveProperty('device');
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
      const mockFileContents = new Buffer(['a'.charCodeAt()]);
      beforeAll(() => {
        ProtocolManager.mockImplementation(() => ({
          fileContents: () => Promise.resolve(mockFileContents),
        }));
      });

      it('returns file data', async () => {
        const res = await jsonClient.get(makeUrl(`/protocols/${mockFilename}`, deviceApi.server.url));
        expect(res.statusCode).toBe(200);
        // For the purposes of testing, compare string
        expect(res.json).toBeUndefined();
        expect(res.data).toEqual(mockFileContents.toString());
      });
    });
  });
});
