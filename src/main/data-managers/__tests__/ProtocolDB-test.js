/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
import ProtocolDB from '../ProtocolDB';

import { ErrorMessages } from '../../errors/RequestError';

jest.mock('electron-log');

describe('ProtocolDB', () => {
  const mockProtocol = { name: 'a', version: '1' };
  let db;
  beforeEach(() => {
    db = new ProtocolDB(null, true);
  });

  it('persists protocol metadata', async () => {
    const result = await db.save('a.netcanvas', new Buffer([]), mockProtocol);
    expect(result).toMatchObject(mockProtocol);
  });

  it('requires a file', async () => {
    await expect(db.save(null))
      .rejects.toMatchObject({ message: ErrorMessages.InvalidFile });
  });

  it('requires a buffer', async () => {
    await expect(db.save('a.netcanvas', null))
      .rejects.toMatchObject({ message: ErrorMessages.InvalidFile });
  });

  it('requires metadata to be defined', async () => {
    await expect(db.save('a.netcanvas', new Buffer([]), null))
      .rejects.toMatchObject({ message: ErrorMessages.InvalidFile });
  });

  it('requires no specific metadata', async () => {
    const result = await db.save('a.netcanvas', new Buffer([]), {});
    expect(result).toMatchObject({});
  });

  it('calcualtes a checksum', async () => {
    const result = await db.save('a.netcanvas', new Buffer([]), mockProtocol);
    expect(result).toHaveProperty('sha256');
  });

  describe('with saved records', () => {
    beforeEach(async () => {
      await db.save('a.netcanvas', new Buffer([]), mockProtocol);
      await db.save('b.netcanvas', new Buffer([]), mockProtocol);
    });

    it('fetches records from db', async () => {
      const results = await db.all();
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(2);
    });

    it('fetches the first matching query', async () => {
      const first = await db.first({ filename: 'a.netcanvas' });
      expect(first).toMatchObject({ filename: 'a.netcanvas' });
      const second = await db.first({ filename: 'b.netcanvas' });
      expect(second).toMatchObject({ filename: 'b.netcanvas' });
    });

    it('gets by ID', async () => {
      const first = await db.first({ filename: 'a.netcanvas' });
      const a = await db.get(first._id);
      expect(a).toMatchObject({ filename: 'a.netcanvas' });
    });

    it('removes a protocol', async () => {
      const saved = await db.save('c.netcanvas', new Buffer([]), mockProtocol);
      expect(saved._id).toEqual(expect.any(String));
      expect(await db.get(saved._id)).not.toBe(null);
      db.destroy(saved);
      expect(await db.get(saved._id)).toBe(null);
    });

    it('requires an ID for removal', async () => {
      expect(db.destroy({})).rejects.toMatchObject({ message: 'Cannot delete protocol without an id' });
    });
  });
});
