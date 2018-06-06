/* eslint-env jest */
import fs from 'fs';
import { dialog } from 'electron';
import JSZip from 'jszip';

import ProtocolManager from '../ProtocolManager';

jest.mock('fs');
jest.mock('electron');
jest.mock('electron-log');
jest.mock('jszip');
jest.mock('../ProtocolDB');

describe('ProtocolManager', () => {
  const mockFileContents = new Buffer([]);
  const errorMessages = ProtocolManager.ErrorMessages;
  let manager;
  let invalidFileErr;

  beforeEach(() => {
    manager = new ProtocolManager('.');
    invalidFileErr = expect.objectContaining({ message: errorMessages.InvalidFile });
  });

  describe('UI hook', () => {
    const mockFileList = ['a.netcanvas'];

    it('presents a dialog', () => {
      manager.presentImportDialog();
      expect(dialog.showOpenDialog).toHaveBeenCalled();
    });

    it('allows an import via the open dialog', (done) => {
      const simulateChooseFile = (opts, callback) => {
        callback(mockFileList);
        expect(manager.validateAndImport).toHaveBeenCalled();
        done();
      };
      manager.validateAndImport = jest.fn().mockReturnValue(Promise.resolve(mockFileList));
      dialog.showOpenDialog.mockImplementation(simulateChooseFile);
      manager.presentImportDialog();
    });

    it('allows dialog to be cancelled', (done) => {
      expect.assertions(1);
      const simulateChooseNothing = (opts, callback) => {
        callback();
        expect(manager.validateAndImport).not.toHaveBeenCalled();
        done();
      };
      manager.validateAndImport = jest.fn();
      dialog.showOpenDialog.mockImplementation(simulateChooseNothing);
      manager.presentImportDialog();
    });
  });

  describe('import interface', () => {
    it('requires files to import', async () => {
      const emptyErr = expect.objectContaining({ message: errorMessages.EmptyFilelist });
      await expect(manager.validateAndImport()).rejects.toEqual(emptyErr);
    });

    it('makes a directory if needed', () => {
      manager.validateAndImport(['foo.netcanvas']);
      expect(fs.mkdir).toHaveBeenCalledWith(manager.protocolDir, expect.any(Function));
    });

    describe('with a valid directory', () => {
      beforeEach(() => {
        manager.ensureDataDir = jest.fn(() => Promise.resolve());
      });

      it('requires a valid file extension', async () => {
        await expect(manager.validateAndImport(['file.unknownextension'])).rejects.toEqual(invalidFileErr);
      });

      it('imports & promises each file', async () => {
        manager.importFile = jest.fn(infile => `copy-${infile}`);
        manager.postProcessFile = jest.fn(filename => Promise.resolve(filename));
        const mockFiles = ['a.netcanvas', 'b.netcanvas', 'c.netcanvas'];
        const results = await manager.validateAndImport(mockFiles);
        expect(results).toHaveLength(3);
        expect(results[0]).toMatch(mockFiles[0]);
        expect(manager.importFile).toHaveBeenCalledTimes(3);
      });

      // TBD what we want to do here...
      it.skip('overwrites existing files', () => {});
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
          await expect(manager.ensureDataDir()).resolves.toMatch(manager.protocolDir);
        });
      });

      describe('with an unexpected error', () => {
        beforeEach(() => {
          existErr.message = 'Unexpected Error';
        });

        it('rejects', async () => {
          await expect(manager.ensureDataDir()).rejects.toMatchObject(existErr);
        });
      });
    });
  });

  describe('file handling', () => {
    it('uses fs to copy a file', () => {
      manager.importFile('foo.netcanvas');
      expect(fs.copyFile)
        .toHaveBeenCalledWith('foo.netcanvas', expect.stringMatching(/foo\.netcanvas/), expect.any(Function));
    });

    it('requires a filename', async () => {
      await expect(manager.importFile()).rejects.toEqual(invalidFileErr);
    });

    it('resolves with the destination filename', async () => {
      fs.copyFile.mockImplementation((src, dest, cb) => { cb(); });
      await expect(manager.importFile('foo.netcanvas')).resolves.toMatch(/foo/);
    });

    it('rejects on failure', async () => {
      const err = new Error('Mock error');
      fs.copyFile.mockImplementation((src, dest, cb) => { cb(err); });
      await expect(manager.importFile('foo.netcanvas')).rejects.toEqual(err);
    });

    it('uses fs to find existing files', async () => {
      const mockFiles = [{ filename: 'a.netcanvas' }];
      manager.db.all.mockReturnValue(Promise.resolve(mockFiles));
      await expect(manager.allProtocols())
        .resolves.toContainEqual(expect.objectContaining(mockFiles[0]));
    });
  });

  describe('fileContents', () => {
    it('rejects on missing input', async () => {
      await expect(manager.fileContents()).rejects.toMatchObject(invalidFileErr);
    });

    it('will not try to read file outside directory', async () => {
      expect(fs.readFile).not.toHaveBeenCalled();
      await expect(manager.fileContents('../insecureaccess')).rejects.toMatchObject(invalidFileErr);
    });

    it('returns raw content buffer', async () => {
      expect.assertions(2);
      fs.readFile.mockImplementation((file, opts, cb) => {
        const fn = typeof cb === 'undefined' ? opts : cb;
        expect(opts.encoding).toBeUndefined();
        fn(null, mockFileContents);
      });
      await expect(manager.fileContents('a.netcanvas')).resolves.toEqual(mockFileContents);
    });

    describe('when file does not exist', () => {
      beforeAll(() => {
        fs.readFile.mockImplementation((file, opts, cb) => {
          const fn = typeof cb === 'undefined' ? opts : cb;
          fn(invalidFileErr);
        });
      });

      it('rejects when file is missing', async () => {
        await expect(manager.fileContents('missingfile')).rejects.toMatchObject(invalidFileErr);
      });
    });
  });

  describe('post-processing', () => {
    beforeAll(() => {
      fs.readFile.mockImplementation((file, cb) => cb(null, mockFileContents));
      const mockProtocolZipObj = {
        async: () => JSON.stringify({ name: 'myProtocol' }),
      };
      const mockZipContents = { files: { 'protocol.json': mockProtocolZipObj } };
      JSZip.loadAsync.mockReturnValue(Promise.resolve(mockZipContents));
    });

    it('parses file to get metadata', async () => {
      await manager.postProcessFile('');
      expect(JSZip.loadAsync).toHaveBeenCalled();
    });

    it('saves metadata to DB', async () => {
      await manager.postProcessFile('');
      expect(manager.db.save).toHaveBeenCalled();
    });
  });

  describe('post-processing failures', () => {
    beforeAll(() => {
      fs.readFile.mockImplementation((file, cb) => cb(null, mockFileContents));
      JSZip.loadAsync.mockImplementation(() => Promise.reject({}));
    });

    it('rejects if protocol cannot be read', async () => {
      await expect(manager.postProcessFile('')).rejects.toMatchObject(invalidFileErr);
    });
  });

  describe('deletion', () => {
    it('removes the file', () => {
      const mockProtocol = { filename: 'a.netcanvas' };
      manager.destroyProtocol(mockProtocol);
      expect(fs.unlink).toHaveBeenCalled();
      const call = fs.unlink.mock.calls[0];
      expect(call[0]).toMatch(mockProtocol.filename);
    });

    it('removes a protocol from DB', async () => {
      const mockProtocol = { filename: 'a.netcanvas' };
      fs.unlink.mockImplementation((path, cb) => { cb(); });
      manager.db.destroy.mockResolvedValue({});
      await manager.destroyProtocol(mockProtocol);
      expect(manager.db.destroy).toHaveBeenCalledWith(mockProtocol);
    });

    it('removes all protocols', async () => {
      const mockProtocols = [{ filename: 'a' }, { filename: 'b' }];
      manager.db.all.mockResolvedValue(mockProtocols);
      manager.db.destroy.mockResolvedValue(1);
      manager.destroyProtocol = jest.fn();
      await manager.destroyAllProtocols();
      expect(manager.destroyProtocol).toHaveBeenCalledTimes(mockProtocols.length);
    });
  });

  describe('get', () => {
    it('returns from DB based on ID', () => {
      const id = 'a';
      manager.getProtocol(id);
      expect(manager.db.get).toHaveBeenCalledWith(id);
    });
  });
});
