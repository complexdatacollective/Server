/* eslint-env jest */
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

  it('fetches records from db', async () => {
    await db.save('a.netcanvas', new Buffer([]), mockProtocol);
    const results = await db.all();
    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBe(1);
  });
});
