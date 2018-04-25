/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const { PairingRequestService } = require('../pairingRequestService');

jest.mock('electron-log');

describe('PairingRequest Service', () => {
  let reqSvc;

  beforeEach(() => {
    reqSvc = new PairingRequestService();
  });

  it('creates a new request', (done) => {
    reqSvc.db.count({}, (err, initialCount) => {
      reqSvc.createRequest()
        .then(() => {
          reqSvc.db.count({}, (err2, count) => {
            expect(count).toBe(initialCount + 1);
            done();
          });
        });
    });
  });

  it('verifies an existing request', async () => {
    const req = await reqSvc.createRequest();
    expect(reqSvc.verifyRequest(req._id, req.pairingCode)).resolves
      .toMatchObject({ pairingCode: expect.any(String) });
  });

  it('rejects a missing or expired request', async () => {
    await expect(
      reqSvc.verifyRequest('bad-id', 'wrong-code'),
    ).rejects.toBeInstanceOf(Error);
  });

  it('rejects a malformed request', async () => {
    await expect(
      reqSvc.verifyRequest(),
    ).rejects.toBeInstanceOf(Error);
  });
});
