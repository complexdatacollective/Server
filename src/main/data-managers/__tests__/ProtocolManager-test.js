/* eslint-env jest */
import fs from 'fs';
import JSZip from 'jszip';
import path from 'path';
import { dialog } from 'electron';
import ProtocolManager from '../ProtocolManager';
import promisedFs from '../../utils/promised-fs';

jest.mock('fs');
jest.mock('electron');
jest.mock('electron-log');
jest.mock('jszip');
jest.mock('../../utils/promised-fs');
jest.mock('../ProtocolDB');
jest.mock('../SessionDB');

const anyNetcanvasFile = expect.stringMatching(/\.netcanvas$/);

describe('ProtocolManager', () => {
  const mockFileContents = Buffer.from([0x01]);
  const errorMessages = ProtocolManager.ErrorMessages;
  let manager;

  beforeAll(() => {
    promisedFs.tryUnlink.mockResolvedValue(undefined);
  });

  beforeEach(() => {
    manager = new ProtocolManager('.');
    manager.db.save = jest.fn().mockResolvedValue({});
  });

  describe('UI hook', () => {
    const mockFileList = ['a.netcanvas'];

    it('presents a dialog', () => {
      manager.presentImportDialog();
      expect(dialog.showOpenDialog).toHaveBeenCalled();
    });

    it('allows an import via the open dialog', () => {
      expect.assertions(1);
      const simulateChooseFile = Promise.resolve({ filePaths: mockFileList });
      manager.validateAndImport = jest.fn().mockReturnValue(Promise.resolve(mockFileList));
      dialog.showOpenDialog.mockReturnValue(simulateChooseFile);
      return manager.presentImportDialog()
        .then(() => {
          expect(manager.validateAndImport).toHaveBeenCalled();
        });
    });

    it('allows dialog to be cancelled', () => {
      expect.assertions(1);
      const simulateChooseNothing = Promise.resolve({ canceled: true });
      manager.validateAndImport = jest.fn();
      dialog.showOpenDialog.mockReturnValue(simulateChooseNothing);
      return manager.presentImportDialog()
        .then(() => {
          expect(manager.validateAndImport).not.toHaveBeenCalled();
        });
    });
  });

  describe('import interface', () => {
    it('requires files to import', async () => {
      await expect(manager.validateAndImport())
        .rejects.toMatchErrorMessage(errorMessages.EmptyFilelist);
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
        await expect(manager.validateAndImport(['file.unknownextension']))
          .rejects.toMatchErrorMessage(errorMessages.InvalidContainerFileExtension);
      });

      it('limits to one file', async () => {
        const mockFiles = ['a.netcanvas', 'b.netcanvas', 'c.netcanvas'];
        await expect(manager.validateAndImport(mockFiles))
          .rejects.toMatchErrorMessage(errorMessages.FilelistNotSingular);
      });

      it('imports & promises one file', async () => {
        manager.importFile = jest.fn(infile => `copy-${infile}`);
        manager.processFile = jest.fn(filename => Promise.resolve(filename));
        const mockFilename = 'a.netcanvas';
        const result = await manager.validateAndImport([mockFilename]);
        expect(result).toEqual(mockFilename);
        expect(manager.importFile).toHaveBeenCalledTimes(1);
      });
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
    beforeEach(() => {
      fs.copyFile.mockClear();
    });

    it('uses fs to copy a file', () => {
      manager.importFile('foo.netcanvas');
      expect(fs.copyFile)
        .toHaveBeenCalledWith('foo.netcanvas', anyNetcanvasFile, expect.any(Function));
    });

    it('renames the file base', () => {
      manager.importFile('foo.netcanvas');
      expect(fs.copyFile)
        .toHaveBeenCalledWith('foo.netcanvas', expect.not.stringMatching(/foo\.netcanvas/), expect.any(Function));
    });

    it('does not overwrite a file', () => {
      manager.importFile('foo.netcanvas');
      manager.importFile('foo.netcanvas');
      const mockCalls = fs.copyFile.mock.calls;
      expect(mockCalls).toHaveLength(2);
      const srcArgs = [mockCalls[0][0], mockCalls[1][0]];
      const destArgs = [mockCalls[0][1], mockCalls[1][1]];
      expect(srcArgs[0]).toEqual(srcArgs[1]); // copies from same source
      expect(destArgs[0]).not.toEqual(destArgs[1]); // ...to a new location
    });

    it('requires a filename', async () => {
      await expect(manager.importFile())
        .rejects.toMatchErrorMessage(errorMessages.InvalidContainerFile);
    });

    it('resolves with the destination filename', async () => {
      fs.copyFile.mockImplementation((src, dest, cb) => { cb(); });
      const response = { destPath: path.join('protocols', 'foo.netcanvas'), protocolName: 'foo' };
      await expect(manager.importFile('foo.netcanvas')).resolves.toMatchObject(response);
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
      await expect(manager.fileContents())
        .rejects.toMatchErrorMessage(errorMessages.InvalidContainerFile);
    });

    it('will not try to read file outside directory', async () => {
      expect(fs.readFile).not.toHaveBeenCalled();
      await expect(manager.fileContents('../insecureaccess')).rejects.toMatchErrorMessage(errorMessages.InvalidContainerFile);
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
          fn({ message: errorMessages.InvalidContainerFile });
        });
      });

      it('rejects when file is missing', async () => {
        await expect(manager.fileContents('missingfile')).rejects.toMatchErrorMessage(errorMessages.InvalidContainerFile);
      });
    });
  });

  describe('post-processing', () => {
    const mockProtocolZipObj = {
      async: () => JSON.stringify({ name: 'myProtocol' }),
    };
    const mockZipContents = { files: { 'protocol.json': mockProtocolZipObj } };

    beforeAll(() => {
      promisedFs.readFile.mockResolvedValue(mockFileContents);
      JSZip.loadAsync.mockReturnValue(Promise.resolve(mockZipContents));
    });

    afterEach(() => {
      JSZip.loadAsync.mockClear();
    });

    it('parses file to get metadata', async () => {
      await manager.processFile('foo.netcanvas', 'foo.netcanvas', 'foo');
      expect(JSZip.loadAsync).toHaveBeenCalled();
    });

    it('saves metadata to DB', async () => {
      await manager.processFile('foo.netcanvas', 'foo.netcanvas', 'foo');
      expect(manager.db.save).toHaveBeenCalled();
    });

    it('returns base filename (without path)', async () => {
      const promise = manager.processFile('foo/bar.netcanvas', 'foo.netcanvas', 'foo');
      await expect(promise).resolves.toEqual(expect.not.stringContaining('foo/'));
    });

    // it('skips update if file is identical', async () => {
    //   const spy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    //   await expect(manager.processFile('foo.netcanvas', 'foo.netcanvas', 'foo'))
    //    .resolves.toEqual(anyNetcanvasFile);
    //   expect(JSZip.loadAsync).not.toHaveBeenCalled();
    //   spy.mockRestore();
    // });

    describe('when file read fails', () => {
      const readErr = new Error('read-error');
      beforeAll(() => promisedFs.readFile.mockRejectedValue(readErr));

      it('rejects', async () => {
        await expect(manager.processFile('')).rejects.toThrow(readErr);
      });
    });

    describe('when file is empty', () => {
      beforeAll(() => promisedFs.readFile.mockResolvedValue(Buffer.from([])));

      it('rejects', async () => {
        await expect(manager.processFile('')).rejects.toMatchErrorMessage(errorMessages.InvalidContainerFile);
      });
    });

    describe('when zip load fails', () => {
      it('rejects', async () => {
        promisedFs.readFile.mockResolvedValue(mockFileContents);
        JSZip.loadAsync.mockRejectedValue({});
        await expect(manager.processFile('', '', '')).rejects.toMatchErrorMessage(errorMessages.InvalidZip);
      });
    });

    describe('when JSON parsing fails', () => {
      it('rejects', async () => {
        const failingJsonLoader = { async: jest.fn().mockResolvedValue('not-json') };
        const mockBadContents = { files: { 'protocol.json': failingJsonLoader } };
        JSZip.loadAsync.mockResolvedValue(mockBadContents);
        await expect(manager.processFile('', '', '')).rejects.toMatchErrorMessage(errorMessages.InvalidProtocolFormat);
      });
    });

    describe('when DB save fails', () => {
      const mockError = new Error('db-error');
      it('rejects', async () => {
        JSZip.loadAsync.mockResolvedValue(mockZipContents);
        manager.db.save.mockRejectedValueOnce(mockError);
        await expect(manager.processFile('', '', '')).rejects.toThrow(mockError);
      });
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

    it('rejects when unlink errors if ensureFileDeleted is requested', async () => {
      const mockProtocol = { filename: 'a.netcanvas' };
      const mockError = new Error('mock error');
      fs.unlink.mockImplementation((filepath, cb) => { cb(mockError); });
      await expect(manager.destroyProtocol(mockProtocol, true)).rejects.toEqual(mockError);
    });

    it('rejects when db errors', async () => {
      const mockProtocol = { filename: 'a.netcanvas' };
      const mockError = new Error('mock error');
      fs.unlink.mockImplementation((filepath, cb) => { cb(); });
      manager.db.destroy.mockRejectedValue(mockError);
      await expect(manager.destroyProtocol(mockProtocol, true)).rejects.toEqual(mockError);
    });

    it('removes a protocol from DB', async () => {
      const mockProtocol = { filename: 'a.netcanvas' };
      fs.unlink.mockImplementation((filepath, cb) => { cb(); });
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

    it('removes all sessions', () => {
      manager.destroyAllSessions();
      expect(manager.sessionDb.deleteAll).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('returns from DB based on ID', () => {
      const id = 'a';
      manager.getProtocol(id);
      expect(manager.db.get).toHaveBeenCalledWith(id);
    });
  });

  describe('session manager', () => {
    const protocolId = 'protocol1';

    it('finds all sessions for a protocol via DB', () => {
      manager.getProtocolSessions(protocolId);
      expect(manager.sessionDb.findAll).toHaveBeenCalled();
      expect(manager.sessionDb.findAll.mock.calls[0][0]).toEqual(protocolId);
    });

    it('accepts a limit', () => {
      manager.getProtocolSessions(protocolId, 100);
      expect(manager.sessionDb.findAll).toHaveBeenCalledWith(protocolId, 100);
    });

    it('deletes a session via DB', () => {
      manager.deleteProtocolSessions(protocolId, 'session1');
      expect(manager.sessionDb.delete).toHaveBeenCalledWith(protocolId, 'session1');
    });

    it('allows omitting ID (to delete multiple)', () => {
      manager.deleteProtocolSessions('protocol1');
      expect(manager.sessionDb.delete).toHaveBeenCalledWith(protocolId, null);
    });

    describe('insertion', () => {
      const mockProtocol = { _id: protocolId };
      beforeEach(() => {
        manager.db.get = jest.fn().mockResolvedValue(mockProtocol);
      });

      it('adds a session', async () => {
        const mockSession = { uid: '1' };
        await manager.addSessionData(protocolId, mockSession);
        expect(manager.sessionDb.insertAllForProtocol)
          .toHaveBeenCalledWith(mockSession, mockProtocol);
      });

      it('resolves with the documents', async () => {
        manager.sessionDb.insertAllForProtocol.mockResolvedValue([]);
        await expect(manager.addSessionData(protocolId, [])).resolves.toEqual(expect.any(Array));
      });

      it('rejects if adding to an unknown protocol', async () => {
        manager.db.get = jest.fn().mockResolvedValue(null);
        await expect(manager.addSessionData(null, []))
          .rejects.toMatchErrorMessage(errorMessages.ProtocolNotFoundForSession);
      });
    });
  });
});
