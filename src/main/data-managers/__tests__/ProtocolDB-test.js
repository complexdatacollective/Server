/* eslint-env jest */
/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
import ProtocolDB from '../ProtocolDB';

import { ErrorMessages } from '../../errors/RequestError';

jest.mock('electron-log');

describe('ProtocolDB', () => {
  const mockProtocol = { name: 'a', description: 'v1' };
  let db;
  beforeEach(() => {
    db = new ProtocolDB(null, { inMemoryOnly: true });
  });

  it('persists protocol metadata (name & description)', async () => {
    const result = await db.save('a.netcanvas', Buffer.from([]), mockProtocol);
    expect(result).toMatchObject(mockProtocol);
  });

  it('persists the codebook', async () => {
    const codebook = { codebook: { nodes: {} } };
    const result = await db.save('a.netcanvas', Buffer.from([]), { ...mockProtocol, ...codebook });
    expect(result).toMatchObject(codebook);
  });

  it('inserts metadata with new name', async () => {
    await db.save('a.netcanvas', Buffer.from([]), { name: 'a' });
    await db.save('a.netcanvas', Buffer.from([]), { name: 'b' });
    const results = await db.all();
    expect(results.length).toBe(2);
  });

  it('requires file data', async () => {
    await expect(db.save('a.netcanvas', null, { name: 'a' })).rejects.toMatchErrorMessage(ErrorMessages.InvalidContainerFile);
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

  it('returns new & old docs if requested', async () => {
    const result1 = await db.save('a.netcanvas', Buffer.from([]), mockProtocol);
    const result2 = await db.save('a.netcanvas', Buffer.from([0xbf]), mockProtocol, { returnOldDoc: true });
    expect(result2).toHaveProperty('curr');
    expect(result2.prev).toEqual(result1);
  });

  it('requires a file', async () => {
    await expect(db.save(null)).rejects.toMatchErrorMessage(ErrorMessages.InvalidContainerFile);
  });

  it('requires a buffer', async () => {
    await expect(db.save('a.netcanvas', null)).rejects.toMatchErrorMessage(ErrorMessages.InvalidContainerFile);
  });

  it('requires metadata to be defined', async () => {
    await expect(db.save('a.netcanvas', Buffer.from([]), null)).rejects.toMatchErrorMessage(ErrorMessages.InvalidProtocolFormat);
  });

  it('requires only a "name" prop in metadata', async () => {
    const nameless = db.save('a.netcanvas', Buffer.from([]), {});
    await expect(nameless).rejects.toMatchErrorMessage(ErrorMessages.InvalidProtocolFormat);
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
      await expect(db.destroy({})).rejects.toMatchErrorMessage('Cannot delete protocol without an id');
    });
  });

  describe('when underlying db fails', () => {
    const mockError = new Error('database error');
    beforeEach(() => {
      db.db.update = jest.fn((...args) => args[args.length - 1](mockError));
      db.db.remove = jest.fn((...args) => args[args.length - 1](mockError));
      db.db.findOne = jest.fn((...args) => args[args.length - 1](mockError));
    });

    it('rejects a save', async () => {
      await expect(db.save('a.netcanvas', Buffer.from([]), mockProtocol)).rejects.toThrow(mockError);
    });

    it('rejects a query', async () => {
      await expect(db.first()).rejects.toThrow(mockError);
    });

    it('rejects a destroy', async () => {
      await expect(db.destroy({ _id: 'a' })).rejects.toThrow(mockError);
    });
  });
});
