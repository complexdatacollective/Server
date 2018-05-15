/* eslint-env jest */
module.exports = {
  ready: Promise.resolve(true),
  randombytes_buf: jest.fn().mockImplementation(len => new Uint8Array(len)),
  crypto_secretbox_easy: jest.fn().mockReturnValue(new Uint8Array()),
  crypto_secretbox_open_easy: jest.fn(),
  crypto_pwhash: jest.fn().mockImplementation(len => new Uint8Array(len)),
  from_hex: jest.fn().mockImplementation(s => new Uint8Array(s.length / 2)),
  from_string: jest.fn().mockReturnValue(s => new Uint8Array(s.length)),
  to_hex: jest.fn().mockReturnValue('112233aabbcc'),
  to_string: jest.fn().mockReturnValue(''),

  crypto_pwhash_SALTBYTES: 16,
  crypto_secretbox_KEYBYTES: 32,
  crypto_secretbox_NONCEBYTES: 24,
};
