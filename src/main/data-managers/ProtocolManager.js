const { dialog } = require('electron');
const logger = require('electron-log');
const fs = require('fs');
const path = require('path');
const jszip = require('jszip');

const RequestError = require('../errors/RequestError');

const validFileExts = ['netcanvas'];
const validExtPattern = new RegExp(`\\.(${validFileExts.join('|')})$`);
const protocolDirName = 'protocols';

const ErrorMessages = {
  EmptyFilelist: 'Empty filelist',
  InvalidFile: 'Invalid File',
};

const ProtocolDataFile = 'protocol.json';

const validate = filepath => new Promise((resolve, reject) => {
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
  constructor(dataDir) {
    this.protocolDir = path.join(dataDir, protocolDirName);
    this.presentImportDialog = this.presentImportDialog.bind(this);
    this.validateAndImport = this.validateAndImport.bind(this);
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
          .then(savedFiles => resolve(savedFiles))
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
   * @return {Promise} rejects if there is a problem saving, or on invalid input;
   *                   resolves with an array of file names.
   */
  validateAndImport(fileList) {
    if (!fileList) {
      // User may have cancelled
      return Promise.reject(new RequestError(ErrorMessages.EmptyFilelist));
    }

    const workQueue = [];
    for (let i = 0; i < fileList.length; i += 1) {
      workQueue.push(this.ensureDataDir()
        .then(() => validate(fileList[i]))
        .then(file => this.importFile(file))
        .then((savedFile) => {
          logger.debug(`Imported ${savedFile}`);
          return savedFile;
        })
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

  importFile(filepath = '') {
    return new Promise((resolve, reject) => {
      const filename = path.parse(filepath).base;
      if (!filename) {
        reject(new RequestError(ErrorMessages.InvalidFile));
        return;
      }

      const destPath = path.join(this.protocolDir, filename);
      fs.copyFile(filepath, destPath, (err) => {
        if (err) {
          reject(err);
        }
        resolve(destPath);
      });
    });
  }

  postProcessFile(savedFilename) {
    logger.debug(this);
    return new Promise((resolve, reject) => {
      fs.readFile(savedFilename, (err, dataBuffer) => {
        if (err) {
          logger.error(err);
          reject(err);
          return;
        }
        jszip.loadAsync(dataBuffer)
          .then(zip => zip.files[ProtocolDataFile])
          .then(zipObject => zipObject.async('string'))
          .then(contents => JSON.parse(contents))
          .then((jsonData) => {
            console.log(jsonData);
            resolve(jsonData);
          })
          .catch(() => {
            // Assume that any error indicates invalid protocol zip
            reject(new RequestError(ErrorMessages.InvalidFile));
          });
      });
    });
  }

  savedFiles() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.protocolDir, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(files.filter(f => validExtPattern.test(f)));
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

      this.postProcessFile(filePath);

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
