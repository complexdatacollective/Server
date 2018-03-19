/* eslint-env jest */

const Factory = require('../pairingCodeFactory');

describe('the PairingCodeFactory', () => {

  it('can generate a pairing code', done => {
    Factory.generatePairingCodeAsync()
      .then(code => {
        expect(code).toEqual(expect.any(String));
      })
      .then(done);
  });

});
