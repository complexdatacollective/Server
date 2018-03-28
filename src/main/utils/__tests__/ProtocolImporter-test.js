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
      importer.validateAndImport(['foo']);
      expect(fs.mkdir).toHaveBeenCalled();
    });

    describe('with a valid directory', () => {
      beforeEach(() => {
        importer.ensureDataDir = jest.fn(() => Promise.resolve());
      });

      it('imports & promises each file', (done) => {
        importer.importFile = jest.fn();
        importer.validateAndImport(['a', 'b', 'c'])
          .then(results => expect(results).toHaveLength(3))
          .then(() => expect(importer.importFile).toHaveBeenCalledTimes(3))
          .then(done);
      });

      it('overwrites existing files');
    });
  });

  it('uses fs to copy a file', () => {
    importer.importFile('foo');
    expect(fs.copyFile)
      .toHaveBeenCalledWith('foo', expect.stringMatching(/foo/), expect.any(Function));
  });

  it('requires a filename', async () => {
    const invalidFileErr = expect.objectContaining({ message: errorMessages.InvalidFile });
    await expect(importer.importFile()).rejects.toEqual(invalidFileErr);
  });

  it('resolves with the destination filename', (done) => {
    fs.copyFile = jest.fn((src, dest, cb) => { cb(); });
    importer.importFile('foo')
      .then(file => expect(file).toMatch(/foo/))
      .then(done);
  });

  it('rejects on failure', async () => {
    const err = new Error('Mock error');
    fs.copyFile = jest.fn((src, dest, cb) => { cb(err); });
    await expect(importer.importFile('foo')).rejects.toEqual(err);
  });
});
