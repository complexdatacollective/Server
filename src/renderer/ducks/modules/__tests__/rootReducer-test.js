/* eslint-env jest */

import reducer from '../rootReducer';

describe('the root reducer', () => {
  it('includes the pairing request reducer', () => {
    expect(reducer({}, {})).toHaveProperty('pairingRequest');
  });
});
