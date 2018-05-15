/* eslint-env jest */

const Factory = require('../PairingCodeFactory');

const pairingCodeLength = 16;

describe('the PairingCodeFactory', () => {
  it('can generate a pairing code', async () => {
    const code = await Factory.generatePairingCodeAsync();
    expect(code).toMatch(new RegExp(`[a-z]{${pairingCodeLength}}`));
  });
});
