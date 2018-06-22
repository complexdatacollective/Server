/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */

const { PairingRequestService } = require('../PairingRequestService');
const { ErrorMessages, RequestError } = require('../../../errors/RequestError');
const { decrypt } = require('../../../utils/shared-api/cipher');


jest.mock('electron-log');
jest.mock('../../../utils/shared-api/cipher');

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

  it('creates requests with `_id` property', async () => {
    // DeviceAPI relies on unique _id for mapping observers
    const req = await reqSvc.createRequest();
    expect(req._id.length).toBeGreaterThan(8);
  });

  it('verifies an existing request', async () => {
    const req = await reqSvc.createRequest();
    await expect(reqSvc.verifyAndExpireRequest(req._id, req.pairingCode)).resolves
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

  describe('encrypted request', () => {
    beforeEach(() => {
      reqSvc.verifyAndExpireRequest = jest.fn().mockResolvedValue({});
    });

    describe('when request is valid', () => {
      const mockRequest = {
        pairingRequestId: '1',
        pairingCode: 'abc',
        deviceName: 'somedevice',
      };

      beforeAll(() => {
        decrypt.mockReturnValue(JSON.stringify(mockRequest));
      });

      afterAll(() => {
        decrypt.mockReset();
      });

      beforeEach(async () => {
        await reqSvc.createRequest();
      });

      it('calls through to verify plaintext', async () => {
        await reqSvc.verifyAndExpireEncryptedRequest('');
        expect(reqSvc.verifyAndExpireRequest).toHaveBeenCalledWith(...Object.values(mockRequest));
      });
    });

    describe('when request is invalid', () => {
      it('rejects when not found', async () => {
        const promise = reqSvc.verifyAndExpireEncryptedRequest('');
        expect.assertions(2);
        await expect(promise).rejects.toBeInstanceOf(RequestError);
        await expect(promise).rejects.toMatchObject({ message: ErrorMessages.VerificationFailed });
      });

      it('rejects when found but invalid', async () => {
        await reqSvc.createRequest();
        const promise = reqSvc.verifyAndExpireEncryptedRequest('');
        expect.assertions(2);
        await expect(promise).rejects.toBeInstanceOf(RequestError);
        await expect(promise).rejects.toMatchObject({ message: ErrorMessages.InvalidRequestBody });
      });
    });
  });
});
