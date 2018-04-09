/* eslint-env jest */
import fs from 'fs';
import { dialog } from 'electron';
import ProtocolManager from '../ProtocolManager';

jest.mock('fs');
jest.mock('electron');
jest.mock('electron-log');

describe('ProtocolManager', () => {
  const errorMessages = ProtocolManager.ErrorMessages;
  let importer;
  let invalidFileErr;

  beforeEach(() => {
    importer = new ProtocolManager('.');
    invalidFileErr = expect.objectContaining({ message: errorMessages.InvalidFile });
  });

  describe('UI hook', () => {
    it('presents a dialog', () => {
      importer.presentImportDialog();
      expect(dialog.showOpenDialog).toHaveBeenCalled();
    });
  });

  describe('import interface', () => {
    it('requires files to import', async () => {
      const emptyErr = expect.objectContaining({ message: errorMessages.EmptyFilelist });
      await expect(importer.validateAndImport()).rejects.toEqual(emptyErr);
    });

    it('makes a directory if needed', () => {
      importer.validateAndImport(['foo.netcanvas']);
      expect(fs.mkdir).toHaveBeenCalledWith(importer.protocolDir, expect.any(Function));
    });

    describe('with a valid directory', () => {
      beforeEach(() => {
        importer.ensureDataDir = jest.fn(() => Promise.resolve());
      });

      it('requires a valid file extension', async () => {
        await expect(importer.validateAndImport(['file.unknownextension'])).rejects.toEqual(invalidFileErr);
      });

      it('imports & promises each file', (done) => {
        importer.importFile = jest.fn(infile => `copy-${infile}`);
        importer.validateAndImport(['a.netcanvas', 'b.netcanvas', 'c.netcanvas'])
          .then(results => expect(results).toHaveLength(3))
          .then(() => expect(importer.importFile).toHaveBeenCalledTimes(3))
          .then(done);
      });

      // TBD what we want to do here...
      it('overwrites existing files');
    });
  });

  describe('ensureDataDir()', () => {
    describe('when mkdir errors', () => {
      let existErr;
      beforeAll(() => {
        fs.mkdir.mockImplementation((dir, cb) => {
          cb(existErr);
        });
      });

      beforeEach(() => {
        existErr = new Error();
      });

      describe('with EEXIST', () => {
        beforeEach(() => {
          existErr.code = 'EEXIST';
        });

        it('resolves with the directory', async () => {
          await expect(importer.ensureDataDir()).resolves.toMatch(importer.protocolDir);
        });
      });

      describe('with an unexpected error', () => {
        beforeEach(() => {
          existErr.message = 'Unexpected Error';
        });

        it('rejects', async () => {
          await expect(importer.ensureDataDir()).rejects.toMatchObject(existErr);
        });
      });
    });
  });

  it('uses fs to copy a file', () => {
    importer.importFile('foo.netcanvas');
    expect(fs.copyFile)
      .toHaveBeenCalledWith('foo.netcanvas', expect.stringMatching(/foo\.netcanvas/), expect.any(Function));
  });

  it('requires a filename', async () => {
    await expect(importer.importFile()).rejects.toEqual(invalidFileErr);
  });

  it('resolves with the destination filename', async () => {
    fs.copyFile = jest.fn((src, dest, cb) => { cb(); });
    await expect(importer.importFile('foo.netcanvas')).resolves.toMatch(/foo/);
  });

  it('rejects on failure', async () => {
    const err = new Error('Mock error');
    fs.copyFile = jest.fn((src, dest, cb) => { cb(err); });
    await expect(importer.importFile('foo.netcanvas')).rejects.toEqual(err);
  });

  it('uses fs to find existing files', async () => {
    const mockFiles = ['a.netcanvas'];
    fs.readdir = jest.fn((dir, cb) => { cb(null, mockFiles); });
    await expect(importer.savedFiles()).resolves.toEqual(mockFiles);
  });

  describe('fileContents', () => {
    it('rejects on missing input', async () => {
      await expect(importer.fileContents()).rejects.toMatchObject(invalidFileErr);
    });

    it('will not try to read file outside directory', async () => {
      expect(fs.readFile).not.toHaveBeenCalled();
      await expect(importer.fileContents('../insecureaccess')).rejects.toMatchObject(invalidFileErr);
    });

    it('returns raw content buffer', async () => {
      expect.assertions(2);
      const mockFileContents = new Buffer([]);
      fs.readFile.mockImplementation((file, opts, cb) => {
        const fn = typeof cb === 'undefined' ? opts : cb;
        expect(opts.encoding).toBeUndefined();
        fn(null, mockFileContents);
      });
      await expect(importer.fileContents('a.netcanvas')).resolves.toEqual(mockFileContents);
    });

    describe('when file does not exist', () => {
      beforeAll(() => {
        fs.readFile.mockImplementation((file, opts, cb) => {
          const fn = typeof cb === 'undefined' ? opts : cb;
          fn(invalidFileErr);
        });
      });

      it('rejects when file is missing', async () => {
        await expect(importer.fileContents('missingfile')).rejects.toMatchObject(invalidFileErr);
      });
    });
  });
});
