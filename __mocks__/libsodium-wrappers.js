module.exports = {
  ready: Promise.resolve(true),
  randombytes_buf: jest.fn(),
  crypto_pwhash: jest.fn(),
  to_hex: jest.fn(),
};
