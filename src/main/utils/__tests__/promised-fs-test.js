/* eslint-env jest */
import fs from 'fs';

import pfs from '../promised-fs';

jest.mock('fs');

const helpers = Object.getOwnPropertyNames(pfs);

describe('promisified fs', () => {
  describe('on success', () => {
    const mockFileContents = Buffer.from([0x01]);
    beforeAll(() => {
      fs.mkdir.mockImplementation((p, opts, cb) => (cb || opts)(undefined));
      fs.readFile.mockImplementation((f, opts, cb) => (cb || opts)(undefined, mockFileContents));
      fs.rename.mockImplementation((a, b, cb) => cb(undefined));
      fs.unlink.mockImplementation((f, cb) => cb(undefined));
      fs.writeFile.mockImplementation((f, d, opts, cb) => (cb || opts)(undefined));
    });

    helpers.forEach((helper) => {
      it('resolves successful callback', async () => {
        await expect(pfs[helper]('.')).resolves;
      });
    });

    it('accepts options for readFile', async () => {
      await expect(pfs.readFile('.', {})).resolves.toEqual(mockFileContents);
    });

    it('accepts options for writeFile', async () => {
      await expect(pfs.writeFile('.', Buffer.from([]), {})).resolves.toBe(undefined);
    });

    it('accepts mode for mkdir', async () => {
      await expect(pfs.mkdir('.', 0o777)).resolves.toBe(undefined);
    });
  });

  describe('on error', () => {
    const mockErr = new Error('mock');
    mockErr.code = 'ENOENT';
    beforeAll(() => {
      fs.mkdir.mockImplementation((p, cb) => cb(mockErr));
      fs.readFile.mockImplementation((f, cb) => cb(mockErr));
      fs.rename.mockImplementation((a, b, cb) => cb(mockErr));
      fs.unlink.mockImplementation((f, cb) => cb(mockErr));
      fs.writeFile.mockImplementation((f, d, cb) => cb(mockErr));
    });

    helpers.filter(h => (/try/).test(h)).forEach((helper) => {
      it('resolves despite ENOENT error', async () => {
        await expect(pfs[helper]('.')).resolves.toBe(undefined);
      });
    });

    helpers.filter(h => !(/try/).test(h)).forEach((helper) => {
      it('rejects with error in callback', async () => {
        await expect(pfs[helper]('.')).rejects.toMatchObject(mockErr);
      });
    });
  });

  describe('on synchronous error (invalid args)', () => {
    const mockErr = new Error('mock');
    beforeAll(() => {
      fs.mkdir.mockImplementation(() => { throw mockErr; });
      fs.readFile.mockImplementation(() => { throw mockErr; });
      fs.rename.mockImplementation(() => { throw mockErr; });
      fs.unlink.mockImplementation(() => { throw mockErr; });
      fs.writeFile.mockImplementation(() => { throw mockErr; });
    });

    // fs methods throw (rather than calling back with error) on invalid input
    // All helpers, even "try*", should reject in this case.
    helpers.forEach((helper) => {
      it('rejects with error in callback', async () => {
        await expect(pfs[helper]('.')).rejects.toMatchObject(mockErr);
      });
    });
  });
});
