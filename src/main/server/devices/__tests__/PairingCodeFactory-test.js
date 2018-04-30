/* eslint-env jest */

const Factory = require('../PairingCodeFactory');

describe('the PairingCodeFactory', () => {
  it('can generate a pairing code', async () => {
    const code = await Factory.generatePairingCodeAsync();
    expect(code).toEqual(expect.any(String));
  });
});
