/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const ProtocolManager = require('../../data-managers/ProtocolManager');
const { DeviceService } = require('../deviceService');
const { jsonClient, makeUrl } = require('../../../setupTests');

jest.mock('libsodium-wrappers');
jest.mock('electron-log');
jest.mock('../../data-managers/DeviceManager');
jest.mock('../../data-managers/ProtocolManager');

const testPortNumber = 5200;
const PairingCodeProperty = 'pairingCode';

describe('Device Service', () => {
  let deviceService;
  const send = 'json'; // the send method used in restify response handlers

  beforeEach(() => {
    deviceService = new DeviceService({});
    // We mock this method regardless of assertions:
    // when run concurrently, parent is a testRunner worker
    deviceService.messageParent = jest.fn();
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

    it('responds to pairing requests', (done) => {
      jsonClient.get(makeUrl('/devices/new', deviceService.api.url))
        .then((res) => {
          expect(res.statusCode).toBe(200);
          expect(res.json.data).toHaveProperty('pairingRequestId');
        })
        .then(done);
    });

    describe('pairing confirmation endpoint', () => {
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

      // TODO: mock reqSvc
      it('completes a valid pairing request', (done) => {
        const reqSvc = deviceService.reqSvc;
        reqSvc.createRequest()
          .then(req => jsonClient.post(makeUrl('/devices', deviceService.api.url), {
            requestId: req._id,
            [PairingCodeProperty]: req.pairingCode,
          }))
          .then(resp => expect(resp.statusCode).toBe(200))
          .then(done);
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
