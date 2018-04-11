/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const ProtocolManager = require('../../data-managers/ProtocolManager');
const { DeviceService } = require('../deviceService');
const { jsonClient, makeUrl } = require('../../../setupTests');
const { RequestError } = require('../../errors/RequestError');


jest.mock('libsodium-wrappers');
jest.mock('electron-log');
jest.mock('../../data-managers/DeviceManager');
jest.mock('../../data-managers/ProtocolManager');
jest.mock('../pairingRequestService');

const testPortNumber = 5200;
const PairingCodeProperty = 'pairingCode';

describe('Device Service', () => {
  let deviceService;
  let mockPairingDbRecord;
  const send = 'json'; // the send method used in restify response handlers

  beforeEach(() => {
    deviceService = new DeviceService({});
    // We mock this method regardless of assertions:
    // when run concurrently, parent is a testRunner worker
    deviceService.messageParent = jest.fn();

    mockPairingDbRecord = { _id: '1', salt: 'a', pairingCode: '123' };
    deviceService.reqSvc.createRequest.mockReturnValue(Promise.resolve(mockPairingDbRecord));
  });

  it('responds to a client pairing request', (done) => {
    expect.assertions(3);
    const expectedRespHandler = {
      [send]: (resp) => {
        try {
          expect(resp.status).toBe('ok');
          expect(resp.data).toHaveProperty('pairingRequestId');
          expect(resp.data).toHaveProperty('salt');
        } catch (e) {
          // res.json() should never throw; rejecting here would trigger the error response
        } finally {
          done();
        }
      },
    };

    deviceService.handlers.onPairingRequest(undefined, expectedRespHandler);
  });

  it('does not send the pairing code in-band', (done) => {
    expect.assertions(1);
    const expectedRespHandler = {
      [send]: (resp) => {
        try {
          expect(resp).not.toHaveProperty(PairingCodeProperty);
        } catch (e) {
          // res.json() should never throw; rejecting here would trigger the error response
        } finally {
          done();
        }
      },
    };

    deviceService.handlers.onPairingRequest(undefined, expectedRespHandler);
  });

  it('notifies the main process when a new PIN is created (for out-of-band transfer)', (done) => {
    deviceService.messageParent = jest.fn((msg) => {
      expect(msg.data).toEqual(expect.objectContaining({
        [PairingCodeProperty]: expect.any(String),
      }));
      done();
    });

    deviceService.handlers.onPairingRequest(undefined, { [send]: jest.fn() });
  });

  describe('API', () => {
    beforeEach((done) => {
      deviceService.start(testPortNumber).then(done);
    });

    afterEach((done) => {
      deviceService.stop().then(done);
    });

    it('responds to pairing requests', async () => {
      const res = await jsonClient.get(makeUrl('/devices/new', deviceService.api.url));
      expect(res.statusCode).toBe(200);
      expect(res.json.data).toHaveProperty('pairingRequestId');
    });

    describe('pairing confirmation endpoint', () => {
      beforeEach(() => {
        deviceService.reqSvc.verifyRequest.mockReturnValue(Promise.reject(new RequestError()));
      });

      it('rejects invalid requests', async () => {
        await expect(
          jsonClient.post(makeUrl('/devices', deviceService.api.url), {}),
        ).rejects.toHaveProperty('statusCode', 400);
      });

      it('fails when request data not found or expired', async () => {
        const reqData = { requestId: 1, pairing_code: 1 };
        await expect(
          jsonClient.post(makeUrl('/devices', deviceService.api.url), reqData),
        ).rejects.toHaveProperty('statusCode', 400);
      });

      describe('with a valid request', () => {
        beforeEach(() => {
          // Mock that the pairing request was found & valid:
          deviceService.reqSvc.verifyRequest.mockReturnValue(Promise.resolve({}));
          // Mock that the new device was successfully saved:
          deviceService.deviceManager.createDeviceDocument.mockReturnValue(Promise.resolve({}));
        });

        it('completes a valid pairing request', async () => {
          const resp = await jsonClient.post(makeUrl('/devices', deviceService.api.url), {
            pairingRequestId: '1',
            [PairingCodeProperty]: '12345',
          });
          expect(resp.statusCode).toBe(200);
          expect(resp.json.data).toHaveProperty('device');
        });
      });
    });

    describe('/protocols', () => {
      const mockFilename = 'a.netcanvas';

      beforeAll(() => {
        ProtocolManager.mockImplementation(() => ({
          allProtocols: () => Promise.resolve([{ filename: mockFilename }]),
        }));
      });

      it('lists available protocols via downloadUrl', async () => {
        const res = await jsonClient.get(makeUrl('/protocols', deviceService.api.url));
        const expectedUrl = expect.stringContaining(mockFilename);
        expect(res.statusCode).toBe(200);
        expect(res.json.data).toContainEqual({ downloadUrl: expectedUrl });
      });
    });
  });
});
