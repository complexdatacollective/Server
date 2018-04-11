/* eslint-env jest */
import fs from 'fs';
import { dialog } from 'electron';
import ProtocolManager from '../ProtocolManager';

jest.mock('fs');
jest.mock('electron');
jest.mock('electron-log');
jest.mock('nedb');

describe('ProtocolManager', () => {
  const errorMessages = ProtocolManager.ErrorMessages;
  let importer;
  let invalidFileErr;

  beforeEach(() => {
    importer = new ProtocolManager('.');
    invalidFileErr = expect.objectContaining({ message: errorMessages.InvalidFile });
    importer.postProcessFile = jest.fn(filename => Promise.resolve(filename));
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

      it('imports & promises each file', async () => {
        importer.importFile = jest.fn(infile => `copy-${infile}`);
        const mockFiles = ['a.netcanvas', 'b.netcanvas', 'c.netcanvas'];
        const results = await importer.validateAndImport(mockFiles);
        expect(results).toHaveLength(3);
        expect(results[0]).toMatch(mockFiles[0]);
        expect(importer.importFile).toHaveBeenCalledTimes(3);
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
    fs.copyFile.mockImplementation((src, dest, cb) => { cb(); });
    await expect(importer.importFile('foo.netcanvas')).resolves.toMatch(/foo/);
  });

  it('rejects on failure', async () => {
    const err = new Error('Mock error');
    fs.copyFile.mockImplementation((src, dest, cb) => { cb(err); });
    await expect(importer.importFile('foo.netcanvas')).rejects.toEqual(err);
  });

  it('uses fs to find existing files', async () => {
    const mockFiles = [{ filename: 'a.netcanvas' }];
    importer.db.find.mockImplementation((q, cb) => cb(null, mockFiles));
    await expect(importer.savedFiles())
      .resolves.toContainEqual(expect.objectContaining(mockFiles[0]));
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
