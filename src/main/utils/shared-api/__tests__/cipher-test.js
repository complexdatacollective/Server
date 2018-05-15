/* eslint-env jest */
import {
  decrypt,
  deriveSecretKeyBytes,
  encrypt,
  fromHex,
  newSaltBytes,
  toHex,
} from '../cipher';

const mockSecretHex = '49b2f34ccbc425c941596fa492be0a382467538359de9ee09d42950056f0bc6a';
const mockMessage = '90a387e5c63d';
const saltLength = 16;

jest.mock('libsodium-wrappers');

describe('cipher functions', () => {
  describe('encrypt', () => {
    it('works with string types', () => {
      expect(typeof encrypt('plain', mockSecretHex)).toEqual('string');
    });
    it('requires a message', () => {
      expect(() => encrypt(null, mockSecretHex)).toThrow(/required/);
    });
    it('requires a secret', () => {
      expect(() => encrypt('plain', '')).toThrow(/required/);
    });
  });

  describe('decrypt', () => {
    it('works with string types', () => {
      expect(typeof decrypt(mockMessage, mockSecretHex)).toEqual('string');
    });
  });

  describe('toHex', () => {
    it('accepts a byte array', () => {
      expect(typeof toHex(new Uint8Array(1))).toEqual('string');
    });
    it('does not accept another string', () => {
      expect(() => { toHex(mockSecretHex); }).toThrow(TypeError);
    });
  });

  describe('fromHex', () => {
    it('returns a byte array', () => {
      expect(fromHex(mockMessage)).toBeInstanceOf(Uint8Array);
    });
  });

  describe('deriveSecretKeyBytes', () => {
    it('accepts salt in bytes', () => {
      expect(deriveSecretKeyBytes('passcode', new Uint8Array(saltLength))).toBeInstanceOf(Uint8Array);
    });
    it('requires a salt in bytes', () => {
      expect(() => deriveSecretKeyBytes('passcode', 'aabbcc')).toThrow(TypeError);
    });
    it('validates salt length', () => {
      expect(() => deriveSecretKeyBytes('passcode', new Uint8Array(saltLength * 2))).toThrow(RangeError);
    });
    it('requires a pairing code', () => {
      expect(() => deriveSecretKeyBytes(null, new Uint8Array(saltLength))).toThrow(TypeError);
    });
  });

  describe('newSaltBytes', () => {
    it(`returns a ${saltLength}-byte array`, () => {
      expect(newSaltBytes()).toBeInstanceOf(Uint8Array);
      expect(newSaltBytes()).toHaveLength(saltLength);
    });
  });
});
