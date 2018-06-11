const { dialog } = require('electron');
const logger = require('electron-log');
const fs = require('fs');
const path = require('path');
const jszip = require('jszip');

const ProtocolDB = require('./ProtocolDB');
const SessionDB = require('./SessionDB');
const { ErrorMessages, RequestError } = require('../errors/RequestError');

const validFileExts = ['netcanvas'];
const protocolDirName = 'protocols';

const ProtocolDataFile = 'protocol.json';

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
  constructor(dataDir) {
    this.protocolDir = path.join(dataDir, protocolDirName);
    this.presentImportDialog = this.presentImportDialog.bind(this);
    this.validateAndImport = this.validateAndImport.bind(this);

    const dbFile = path.join(dataDir, 'db', 'protocols.db');
    this.db = new ProtocolDB(dbFile);

    // TODO: move?
    const sessionDbFile = path.join(dataDir, 'db', 'sessions.db');
    this.sessionDb = new SessionDB(sessionDbFile);
  }

  /**
   * Primary entry for native UI (e.g., File -> Import).
   * Display an Open dialog for the user to select importable files.
   * @async
   * @return {Array<string>|undefined} saved file names, or `undefined`
   *                                   if no files were selected
   * @throws If importing of any input file failed
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
          .then((savedFilenames) => {
            resolve(savedFilenames);
          })
          .catch((err) => {
            logger.error(err);
            reject(err);
          });
      });
    });
  }

  /**
   * Primary interface for render-side API
   * @async
   * @param  {FileList} fileList
   * @return {Array<string>} an array of filenames
   * @throws {RequestError|Error} If there is a problem saving, or on invalid input
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
   * @async
   * @param  {string} filepath of existing file on local disk
   * @return {string} The saved filepath.
   * @throws {RequestError|Error} if the file to import isn't found: ErrorMessages.InvalidFile
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
   * Parse protocol.json and persist metadata to DB.
   * @async
   * @param  {string} savedFilepath
   * @return {string} Resolves with the (same) savedFilepath for chaining
   * @throws Rejects if the file is not saved or protocol is invalid
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
            this.db.save(filename, dataBuffer, parsedProtocol);
            resolve(filename);
          })
          .catch((parsingErr) => {
            logger.debug('ZIP parsing error', parsingErr);
            // Assume that any error indicates invalid protocol zip
            reject(new RequestError(ErrorMessages.InvalidFile));
          });
      });
    });
  }

  /**
   * Get a list of all protocol metadata
   * @async
   * @return {Array<Object>} all persisted protocol data
   * @throws {Error}
   */
  allProtocols() {
    return this.db.all();
  }

  // TODO: Probably remove after alpha testing
  destroyAllProtocols() {
    return new Promise((resolve, reject) => {
      this.allProtocols()
        .then(protocols => protocols.map(p => this.destroyProtocol(p)))
        .then(promises => resolve(Promise.all(promises)))
        .catch((err) => {
          logger.error(err);
          reject(err);
        });
    });
  }

  destroyProtocol(protocol, ensureFileDeleted = false) {
    logger.debug('destroying protocol', protocol);
    return new Promise((resolve, reject) => {
      const filePath = path.join(this.protocolDir, protocol.filename);
      fs.unlink(filePath, (fileErr) => {
        if (fileErr && ensureFileDeleted) { reject(fileErr); }
        this.db.destroy(protocol)
          .then(() => resolve(true))
          .catch((dbErr) => {
            logger.error(dbErr);
            reject(dbErr);
          });
      });
    });
  }

  /**
   * Get a protocol by id
   * @async
   * @param {string} filename base name of file
   * @return {Object} persisted protocol data
   * @throws {Error}
   */
  getProtocol(id) {
    return this.db.get(id);
  }

  /**
   * Get the raw contents of saved protocol as a Buffer
   * @async
   * @param {string} savedFilename base filename
   * @return {Buffer} raw file contents
   * @throws {RequestError|Error} If file doesn't exit (ErrorMessages.InvalidFile),
   *         or there is an error reading
   */
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

  addSessionData(id, sessionOrSessions) {
    return this.getProtocol(id)
      .then((protocol) => {
        if (!protocol) {
          throw new RequestError('Invalid Protocol');
        }
        this.sessionDb.insertAllForProtocol(sessionOrSessions, protocol);
      })
      // TODO:
      // - move to array if not one
      // - uniq! on UUID field (add errors if dupes? or keep track of failed UUIDs?)
      // - Promise.all[] insert sessions
      // - how to handle partial success?
      .catch((dbErr) => {
        logger.error(dbErr);
        throw dbErr;
      });
  }
}

Object.freeze(ErrorMessages);
ProtocolManager.ErrorMessages = ErrorMessages;

module.exports = ProtocolManager;
