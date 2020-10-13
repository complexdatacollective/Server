/* eslint-env jest */
const versionGatekeeper = require('../versionGatekeeper');

describe('versionGatekeeper', () => {
  it('returns a 400 error when version mismatch', () => {
    expect.assertions();
    const req = { header: () => -999 };

    const res = {
      send: jest.fn(),
    };

    const next = jest.fn();

    versionGatekeeper(req, res, next);
    expect(next.mock.calls[0][0]).toBe(false);
    expect(res.send.mock.calls[0]).toEqual([
      400,
      { device: -999, error: 'Device API version mismatch.', server: 1 },
    ]);
  });

  it('calls next when version matches', () => {
    expect.assertions(2);
    const req = { header: () => versionGatekeeper.SERVER_API_VERSION };

    const res = {
      send: jest.fn(),
    };

    const next = jest.fn();

    versionGatekeeper(req, res, next);
    expect(res.send.mock.calls.length).toBe(0);
    expect(next.mock.calls[0][0]).toBe(undefined);
  });
});
