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
      fs.readdir.mockImplementation((d, opts, cb) => (cb || opts)(undefined, []));
      fs.rmdir.mockImplementation((p, cb) => cb(undefined));
      fs.readFile.mockImplementation((f, opts, cb) => (cb || opts)(undefined, mockFileContents));
      fs.rename.mockImplementation((a, b, cb) => cb(undefined));
      fs.unlink.mockImplementation((f, cb) => cb(undefined));
      fs.writeFile.mockImplementation((f, d, opts, cb) => (cb || opts)(undefined));
    });

    helpers.forEach((helper) => {
      it('resolves successful callback', async () => {
        expect.hasAssertions();
        await expect(pfs[helper]('__mocks__')).resolves.toAlwaysPass();
      });
    });

    it('accepts options for readFile', async () => {
      await expect(pfs.readFile('foo.txt', {})).resolves.toEqual(mockFileContents);
    });

    it('accepts options for writeFile', async () => {
      await expect(pfs.writeFile('foo.txt', Buffer.from([]), {})).resolves.toBe(undefined);
    });

    it('accepts mode for mkdir', async () => {
      await expect(pfs.mkdir('foo', 0o777)).resolves.toBe(undefined);
    });
  });

  describe('on error', () => {
    const mockErr = new Error('mock');
    mockErr.code = 'ENOENT';
    beforeAll(() => {
      fs.mkdir.mockImplementation((p, cb) => cb(mockErr));
      fs.readdir.mockImplementation((d, opts, cb) => (cb || opts)(mockErr));
      fs.rmdir.mockImplementation((p, cb) => cb(mockErr));
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
      const throwErr = () => { throw mockErr; };
      fs.mkdir.mockImplementation(throwErr);
      fs.readdir.mockImplementation(throwErr);
      fs.rmdir.mockImplementation(throwErr);
      fs.readFile.mockImplementation(throwErr);
      fs.rename.mockImplementation(throwErr);
      fs.unlink.mockImplementation(throwErr);
      fs.writeFile.mockImplementation(throwErr);
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
