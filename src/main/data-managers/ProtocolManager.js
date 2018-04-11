const { dialog } = require('electron');
const logger = require('electron-log');
const fs = require('fs');
const path = require('path');
const jszip = require('jszip');
const NeDB = require('nedb');
const crypto = require('crypto');

const RequestError = require('../errors/RequestError');

const validFileExts = ['netcanvas'];
const protocolDirName = 'protocols';

const ErrorMessages = {
  EmptyFilelist: 'Empty filelist',
  InvalidFile: 'Invalid File',
};

const ProtocolDataFile = 'protocol.json';

const DbConfig = {
  inMemoryOnly: false,
  autoload: true,
  timestampData: true,
};

const validateExt = filepath => new Promise((resolve, reject) => {
  // TODO: validate & extract [#60]
  const parsed = path.parse(filepath);
  if (!validFileExts.includes(parsed.ext.replace(/^\./, ''))) {
    reject(new RequestError(ErrorMessages.InvalidFile));
    return;
  }
  resolve(filepath);
});

/**
 * @class ProtocolManager
 */
class ProtocolManager {
  // TODO: See comments at DeviceManager.dbClient
  static dbClient(filename) {
    if (!this.dbClients) {
      this.dbClients = {};
    }
    if (!this.dbClients[filename]) {
      this.dbClients[filename] = new NeDB({ ...DbConfig, filename });
    }
    return this.dbClients[filename];
  }

  constructor(dataDir) {
    this.protocolDir = path.join(dataDir, protocolDirName);
    this.presentImportDialog = this.presentImportDialog.bind(this);
    this.validateAndImport = this.validateAndImport.bind(this);

    const dbFile = path.join(dataDir, 'db', 'protocols.db');
    this.db = ProtocolManager.dbClient(dbFile);
  }

  /**
   * @return {Promise} Rejects if there was an error.
   *                   Resolves with the saved file names if successful.
   *                   Resolves with undefined if no files were chosen by the user.
   * @description
   * Primary entry for native UI. Display an Open dialog for the user to select
   * importable files.
   */
  presentImportDialog() {
    const opts = {
      title: 'Import Protocol',
      properties: ['openFile'],
      filters: [
        { name: 'Protocols', extensions: validFileExts },
      ],
    };
    return new Promise((resolve, reject) => {
      dialog.showOpenDialog(opts, (filePaths) => {
        if (!filePaths) {
          resolve();
          return;
        }
        this.validateAndImport(filePaths)
          .then(protocolData => resolve(protocolData.map(f => f.filename)))
          .catch((err) => {
            logger.error(err);
            reject(err);
          });
      });
    });
  }

  /**
   * Primary interface for render-side API
   * @param  {FileList} fileList [description]
   * @return {Promise<Object|Error>}
   *         - resolves with an array of protocol metadata (each containing .filename)
   *         - rejects if there is a problem saving, or on invalid input;
   */
  validateAndImport(fileList) {
    if (!fileList) {
      // User may have cancelled
      return Promise.reject(new RequestError(ErrorMessages.EmptyFilelist));
    }

    // TODO: determine failure mode for single error out of batch (if we even need batch)
    const workQueue = [];
    for (let i = 0; i < fileList.length; i += 1) {
      workQueue.push(this.ensureDataDir()
        .then(() => validateExt(fileList[i]))
        .then(file => this.importFile(file))
        .then((savedFilepath) => {
          logger.debug(`Imported ${savedFilepath}`);
          return savedFilepath;
        })
        .then(file => this.postProcessFile(file))
        .then(file => path.parse(file).base));
    }
    return Promise.all(workQueue);
  }

  ensureDataDir() {
    return new Promise((resolve, reject) => {
      fs.mkdir(this.protocolDir, (err) => {
        if (err && err.code !== 'EEXIST') {
          reject(err);
        }
        resolve(this.protocolDir);
      });
    });
  }

  /**
   * Import a file into the working app directory
   * @param  {string} filepath of existing file on local disk
   * @return {Promise<string|Error>} Resolves with saved filepath.
   */
  importFile(localFilepath = '') {
    return new Promise((resolve, reject) => {
      const filename = path.parse(localFilepath).base;
      if (!filename) {
        reject(new RequestError(ErrorMessages.InvalidFile));
        return;
      }

      const destPath = path.join(this.protocolDir, filename);
      fs.copyFile(localFilepath, destPath, (err) => {
        if (err) {
          reject(err);
        }
        resolve(destPath);
      });
    });
  }

  /**
   * Parse protocol.json and persist metadata to DB
   * @param  {string} savedFilepath
   * @return {Promise<string|Error>} Resolves with the (same) savedFilepath for chaining;
   *                   Rejects if the file is not saved or protocol is invalid
   */
  // TODO: any further validation before saving?
  // TODO: delete file if post-process fails?
  postProcessFile(savedFilepath) {
    return new Promise((resolve, reject) => {
      fs.readFile(savedFilepath, (err, dataBuffer) => {
        if (err) {
          logger.error(err);
          reject(err);
          return;
        }
        jszip.loadAsync(dataBuffer)
          .then(zip => zip.files[ProtocolDataFile])
          .then(zipObject => zipObject.async('string'))
          .then(contents => JSON.parse(contents))
          .then((parsedProtocol) => {
            // TODO: Move .base (and correspoinding escape check) to fn
            const filename = path.parse(savedFilepath).base;
            resolve(this.persistProtocolMetadata(filename, dataBuffer, parsedProtocol));
          })
          .catch(() => {
            // Assume that any error indicates invalid protocol zip
            reject(new RequestError(ErrorMessages.InvalidFile));
          });
      });
    });
  }

  // For now, we're overwriting files, so filenames are unique. Upsert based on filename.
  persistProtocolMetadata(baseFilename, rawFileData, { name, version, networkCanvasVersion }) {
    return new Promise((resolve, reject) => {
      this.db.update({
        filename: baseFilename,
      }, {
        filename: baseFilename,
        name,
        version,
        networkCanvasVersion,
        sha256: crypto.createHash('sha256').update(rawFileData).digest('hex'),
      }, {
        multi: false,
        upsert: true,
      }, (dbErr, count, insertedDoc) => {
        if (dbErr || !count) {
          reject(new RequestError(ErrorMessages.InvalidFile));
        } else {
          logger.debug(insertedDoc ? 'Inserted' : 'Updated', 'metadata for', baseFilename);
          resolve(baseFilename);
        }
      });
    });
  }

  allProtocols() {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }

  fileContents(savedFileName) {
    return new Promise((resolve, reject) => {
      if (typeof savedFileName !== 'string') {
        reject(new RequestError(ErrorMessages.InvalidFile));
        return;
      }
      const filePath = path.join(this.protocolDir, savedFileName);

      // Prevent escaping protocol directory
      if (filePath.indexOf(this.protocolDir) !== 0) {
        reject(new RequestError(ErrorMessages.InvalidFile));
        return;
      }

      fs.readFile(filePath, (err, dataBuffer) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(dataBuffer);
      });
    });
  }
}

Object.freeze(ErrorMessages);
ProtocolManager.ErrorMessages = ErrorMessages;

module.exports = ProtocolManager;
