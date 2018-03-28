/* eslint-env jest */
import fs from 'fs';
import { dialog } from 'electron';
import ProtocolImporter from '../ProtocolImporter';

jest.mock('fs');
jest.mock('electron');
jest.mock('electron-log');

describe('ProtocolImporter', () => {
  const errorMessages = ProtocolImporter.ErrorMessages;
  let importer;

  beforeEach(() => {
    importer = new ProtocolImporter('.');
  });

  describe('UI hook', () => {
    it('presents a dialog', () => {
      importer.presentDialog();
      expect(dialog.showOpenDialog).toHaveBeenCalled();
    });
  });

  describe('import interface', () => {
    it('requires files to import', async () => {
      const invalidFileErr = expect.objectContaining({ message: errorMessages.EmptyFilelist });
      await expect(importer.validateAndImport()).rejects.toEqual(invalidFileErr);
    });

    it('makes a directory if needed', () => {
      importer.validateAndImport(['foo.netcanvas']);
      expect(fs.mkdir).toHaveBeenCalled();
    });

    describe('with a valid directory', () => {
      beforeEach(() => {
        importer.ensureDataDir = jest.fn(() => Promise.resolve());
      });

      it('requires a valid file extension', async () => {
        const invalidFileErr = expect.objectContaining({ message: errorMessages.InvalidFile });
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

  it('uses fs to copy a file', () => {
    importer.importFile('foo.netcanvas');
    expect(fs.copyFile)
      .toHaveBeenCalledWith('foo.netcanvas', expect.stringMatching(/foo\.netcanvas/), expect.any(Function));
  });

  it('requires a filename', async () => {
    const invalidFileErr = expect.objectContaining({ message: errorMessages.InvalidFile });
    await expect(importer.importFile()).rejects.toEqual(invalidFileErr);
  });

  it('resolves with the destination filename', (done) => {
    fs.copyFile = jest.fn((src, dest, cb) => { cb(); });
    importer.importFile('foo.netcanvas')
      .then(file => expect(file).toMatch(/foo/))
      .then(done);
  });

  it('rejects on failure', async () => {
    const err = new Error('Mock error');
    fs.copyFile = jest.fn((src, dest, cb) => { cb(err); });
    await expect(importer.importFile('foo.netcanvas')).rejects.toEqual(err);
  });

  it('uses fs to find existing files', (done) => {
    const mockFiles = ['a.netcanvas'];
    fs.readdir = jest.fn((dir, cb) => { cb(null, mockFiles); });
    importer.savedFiles()
      .then(files => expect(files).toEqual(mockFiles))
      .then(done);
  });
});
