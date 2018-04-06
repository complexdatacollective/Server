const { dialog } = require('electron');
const logger = require('electron-log');
const fs = require('fs');
const path = require('path');

const validFileExts = ['netcanvas'];
const validExtPattern = new RegExp(`\\.(${validFileExts.join('|')})$`);
const protocolDirName = 'protocols';

const ErrorMessages = {
  EmptyFilelist: 'Empty filelist',
  InvalidFile: 'Invalid File',
};

const validate = filepath => new Promise((resolve, reject) => {
  // TODO: validate & extract [#60]
  const parsed = path.parse(filepath);
  if (!validFileExts.includes(parsed.ext.replace(/^\./, ''))) {
    reject(new Error(ErrorMessages.InvalidFile));
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
   * @return {Promise} rejects if there is a problem saving, or on invalid input
   */
  validateAndImport(fileList) {
    if (!fileList) {
      // User may have cancelled
      return Promise.reject(new Error(ErrorMessages.EmptyFilelist));
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
        reject(new Error(ErrorMessages.InvalidFile));
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
}

Object.freeze(ErrorMessages);
ProtocolManager.ErrorMessages = ErrorMessages;

module.exports = ProtocolManager;
