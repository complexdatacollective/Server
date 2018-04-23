/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const { PairingRequestService } = require('../PairingRequestService');
const { RequestError } = require('../../../errors/RequestError');

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
    expect(reqSvc.verifyAndExpireRequest(req._id, req.pairingCode)).resolves
      .toMatchObject({ pairingCode: expect.any(String) });
  });

  it('will not verify an existing request twice', async () => {
    const req = await reqSvc.createRequest();
    await reqSvc.verifyAndExpireRequest(req._id, req.pairingCode);
    await expect(reqSvc.verifyAndExpireRequest(req._id, req.pairingCode))
      .rejects.toBeInstanceOf(RequestError);
  });

  it('rejects a missing or expired request', async () => {
    await expect(
      reqSvc.verifyAndExpireRequest('bad-id', 'wrong-code'),
    ).rejects.toBeInstanceOf(Error);
  });

  it('rejects a malformed request', async () => {
    await expect(
      reqSvc.verifyAndExpireRequest(),
    ).rejects.toBeInstanceOf(Error);
  });
});
