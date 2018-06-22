/* eslint-env jest */
import fs from 'fs';

import pfs from '../promised-fs';

jest.mock('fs');

const helpers = Object.getOwnPropertyNames(pfs);

describe('promisified fs', () => {
  describe('on success', () => {
    const mockFileContents = Buffer.from([0x01]);
    beforeAll(() => {
      fs.readFile.mockImplementation((f, opts, cb) => (cb || opts)(undefined, mockFileContents));
      fs.rename.mockImplementation((a, b, cb) => cb(undefined));
      fs.unlink.mockImplementation((f, cb) => cb(undefined));
    });

    helpers.forEach((helper) => {
      it('resolves successful callback', async () => {
        await expect(pfs[helper]('.')).resolves;
      });
    });

    it('accepts options for readFile', async () => {
      await expect(pfs.readFile('.', {})).resolves.toEqual(mockFileContents);
    });
  });

  describe('on error', () => {
    const mockErr = new Error('mock');
    beforeAll(() => {
      fs.readFile.mockImplementation((f, cb) => cb(mockErr));
      fs.rename.mockImplementation((a, b, cb) => cb(mockErr));
      fs.unlink.mockImplementation((f, cb) => cb(mockErr));
    });

    helpers.filter(h => (/try/).test(h)).forEach((helper) => {
      it('resolves despite error', async () => {
        await expect(pfs[helper]('.')).resolves;
      });
    });

    helpers.filter(h => !(/try/).test(h)).forEach((helper) => {
      it('rejects with error in callback', async () => {
        await expect(pfs[helper]('.')).rejects.toMatchObject(mockErr);
      });
    });
  });
});
