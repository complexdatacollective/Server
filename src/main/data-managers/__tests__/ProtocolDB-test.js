/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
import ProtocolDB from '../ProtocolDB';

import { ErrorMessages } from '../../errors/RequestError';

jest.mock('electron-log');

describe('ProtocolDB', () => {
  const mockProtocol = { name: 'a', description: 'v1' };
  let db;
  beforeEach(() => {
    db = new ProtocolDB(null, true);
  });

  it('persists protocol metadata', async () => {
    const result = await db.save('a.netcanvas', Buffer.from([]), mockProtocol);
    expect(result).toMatchObject(mockProtocol);
  });

  it('inserts metadata with new name', async () => {
    await db.save('a.netcanvas', Buffer.from([]), { name: 'a' });
    await db.save('a.netcanvas', Buffer.from([]), { name: 'b' });
    const results = await db.all();
    expect(results.length).toBe(2);
  });

  it('requires file data', async () => {
    await expect(db.save('a.netcanvas', null, { name: 'a' })).rejects.toMatchObject({ message: ErrorMessages.InvalidFile });
  });

  it('updates metadata with same name', async () => {
    await db.save('a.netcanvas', Buffer.from([]), { name: 'a', description: 'v1' });
    await db.save('b.netcanvas', Buffer.from([0xbf]), { name: 'a', description: 'v2' });
    const results = await db.all();
    expect(results.length).toBe(1);
  });

  it('updates description for a protocol', async () => {
    await db.save('a.netcanvas', Buffer.from([]), mockProtocol);
    const updated = { ...mockProtocol, description: `${mockProtocol.description}.1` };
    const result = await db.save('a.netcanvas', Buffer.from([]), updated);
    expect(result).toMatchObject(updated);
  });

  it('updates file digest for a protocol', async () => {
    const result1 = await db.save('a.netcanvas', Buffer.from([]), mockProtocol);
    const result2 = await db.save('a.netcanvas', Buffer.from([0xbf]), mockProtocol);
    expect(result1.sha256Digest).not.toEqual(result2.sha256Digest);
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
    await expect(db.save('a.netcanvas', Buffer.from([]), null))
      .rejects.toMatchObject({ message: ErrorMessages.InvalidProtocolFormat });
  });

  it('requires only a "name" prop in metadata', async () => {
    const nameless = db.save('a.netcanvas', Buffer.from([]), {});
    await expect(nameless).rejects.toMatchObject({ message: ErrorMessages.InvalidProtocolFormat });
    const named = db.save('a.netcanvas', Buffer.from([]), { name: 'a' });
    await expect(named).resolves.toMatchObject({ name: 'a' });
  });

  it('allows a "lastModified" time', async () => {
    const datetime = new Date().toJSON();
    await expect(db.save('a.netcanvas', Buffer.from([]), { name: 'a', lastModified: datetime }))
      .resolves.toMatchObject({ lastModified: datetime });
  });

  it('ignores invalid "lastModified" times', async () => {
    // Note: when persisted on disk, nedb skips undefined props (but can't test for that in-mem)
    await expect(db.save('a.netcanvas', Buffer.from([]), { name: 'a', lastModified: '2016-00-99' }))
      .resolves.toMatchObject({ lastModified: undefined });
  });

  it('ignores modified times older than epoch', async () => {
    await expect(db.save('a.netcanvas', Buffer.from([]), { name: 'a', lastModified: new Date(1969, 11, 31).toJSON() }))
      .resolves.toMatchObject({ lastModified: undefined });
  });

  it('calcualtes a checksum', async () => {
    const result = await db.save('a.netcanvas', Buffer.from([]), mockProtocol);
    expect(result).toHaveProperty('sha256Digest');
  });

  it('normalizes canonical unicode codes in names', async () => {
    await db.save('a.netcanvas', Buffer.from([]), { name: '\u006E\u0303' });
    await db.save('b.netcanvas', Buffer.from([]), { name: '\u00f1' });
    const results = await db.all();
    expect(results).toHaveLength(1);
  });

  describe('with saved records', () => {
    beforeEach(async () => {
      await db.save('a.netcanvas', Buffer.from([]), mockProtocol);
      await db.save('b.netcanvas', Buffer.from([]), { ...mockProtocol, name: `${mockProtocol.name}-1` });
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
      const saved = await db.save('c.netcanvas', Buffer.from([]), mockProtocol);
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
