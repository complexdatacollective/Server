/* eslint-env jest */
const crypto = require('crypto');

const Factory = require('../PairingCodeFactory');

const { PairingCodeLength } = require('../../../utils/shared-api/pairingCodeConfig');

jest.mock('electron');

describe('the PairingCodeFactory', () => {
  it('can generate a pairing code', async () => {
    const code = await Factory.generatePairingCodeAsync();
    expect(code).toMatch(new RegExp(`[a-z]{${PairingCodeLength}}`));
  });

  it('rejects on error', () => {
    const spy = jest.spyOn(crypto, 'randomBytes');
    spy.mockImplementation((size, cb) => cb(new Error('mockErr')));
    expect(Factory.generatePairingCodeAsync()).rejects.toMatchErrorMessage('mockErr');
    spy.mockRestore();
  });

  it('rejects if it cannot create a suitable passcode', () => {
    const spy = jest.spyOn(crypto, 'randomBytes');
    spy.mockImplementation((size, cb) => cb(null, Buffer.from([0x10])));
    expect(Factory.generatePairingCodeAsync()).rejects.toMatchErrorMessage('Could not generate long-enough passcode');
    spy.mockRestore();
  });
});
