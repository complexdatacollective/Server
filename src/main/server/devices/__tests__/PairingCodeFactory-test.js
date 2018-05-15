/* eslint-env jest */

const Factory = require('../PairingCodeFactory');

const { PairingCodeLength } = require('../../../utils/shared-api/pairingCodeConfig');

describe('the PairingCodeFactory', () => {
  it('can generate a pairing code', async () => {
    const code = await Factory.generatePairingCodeAsync();
    expect(code).toMatch(new RegExp(`[a-z]{${PairingCodeLength}}`));
  });
});
