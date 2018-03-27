/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

jest.mock('libsodium-wrappers');
jest.mock('electron-log');
jest.mock('../deviceManager');

const { DeviceService } = require('../deviceService');
const { jsonClient, makeUrl } = require('../../../setupTests');

const testPortNumber = 5200;
const PairingCodeProperty = 'pairingCode';

describe('Device Service', () => {
  let deviceService;

  beforeEach(() => {
    deviceService = new DeviceService({});
    // We mock this method regardless of assertions:
    // when run concurrently, parent is a testRunner worker
    deviceService.messageParent = jest.fn();
  });

  it('responds to a client pairing request', (done) => {
    deviceService.handlers.onPairingRequest(undefined, {
      send: (resp) => {
        expect(resp.status).toBe('ok');
        expect(resp).toHaveProperty('pairingRequest');
        expect(resp.pairingRequest).toHaveProperty('salt');
        done();
      },
    });
  });

  it('does not send the pairing code in-band', (done) => {
    deviceService.handlers.onPairingRequest(undefined, {
      send: (resp) => {
        expect(resp).not.toHaveProperty(PairingCodeProperty);
        done();
      },
    });
  });

  it('notifies the main process when a new PIN is created (for out-of-band transfer)', (done) => {
    deviceService.messageParent = jest.fn((msg) => {
      expect(msg.data).toEqual(expect.objectContaining({
        [PairingCodeProperty]: expect.any(String),
      }));
      done();
    });

    deviceService.handlers.onPairingRequest(undefined, { send: jest.fn() });
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
          expect(res.json).toHaveProperty('pairingRequest');
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
  });
});
