/* eslint-env jest */

const Factory = require('../pairingCodeFactory');

describe('the PairingCodeFactory', () => {
  it('can generate a pairing code', async () => {
    const code = await Factory.generatePairingCodeAsync();
    expect(code).toEqual(expect.any(String));
  });
});
