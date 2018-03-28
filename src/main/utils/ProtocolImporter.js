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

class ProtocolImporter {
  constructor(dataDir) {
    this.protocolDir = path.join(dataDir, protocolDirName);
    this.presentDialog = this.presentDialog.bind(this);
    this.validateAndImport = this.validateAndImport.bind(this);
  }

  /**
   * Primary entry for native UI
   * @return {undefined} See the validateAndImport() callback.
   */
  presentDialog() {
    const opts = {
      title: 'Import Protocol',
      properties: ['openFile'],
      filters: [
        { name: 'Protocols', extensions: validFileExts },
      ],
    };
    dialog.showOpenDialog(opts, this.validateAndImport);
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
ProtocolImporter.ErrorMessages = ErrorMessages;

module.exports = ProtocolImporter;
