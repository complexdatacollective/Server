const fs = require('fs');
const jszip = require('jszip');
const logger = require('electron-log');
const path = require('path');
const uuid = require('uuid/v4');

const dialog = require('../dialog');
const ProtocolDB = require('./ProtocolDB');
const SessionDB = require('./SessionDB');
const { ErrorMessages, RequestError } = require('../errors/RequestError');
const { readFile, rename, tryUnlink } = require('../utils/promised-fs');
const { hexDigest } = require('../utils/sha256');

const validFileExts = ['netcanvas'];
const protocolDirName = 'protocols';

const ProtocolDataFile = 'protocol.json';

const hasValidExtension = filepath => validFileExts.includes(path.extname(filepath).replace(/^\./, ''));

/**
 * Interface to protocol data (higher-level than DB)
 */
class ProtocolManager {
  constructor(dataDir) {
    this.protocolDir = path.join(dataDir, protocolDirName);
    this.presentImportDialog = this.presentImportDialog.bind(this);
    this.validateAndImport = this.validateAndImport.bind(this);

    const dbFile = path.join(dataDir, 'db', 'protocols.db');
    this.db = new ProtocolDB(dbFile);

    const sessionDbFile = path.join(dataDir, 'db', 'sessions.db');
    this.sessionDb = new SessionDB(sessionDbFile);
    this.reportDb = this.sessionDb;
  }

  pathToProtocolFile(filename) {
    return path.join(this.protocolDir, filename);
  }

  /**
   * Primary entry for native UI (e.g., File -> Import).
   * Display an Open dialog for the user to select importable files.
   * @async
   * @return {string|undefined} Resolves with the original requested filename, or
   *                                     `undefined` if no files were selected
   * @throws {Error} If importing of any input file failed
   */
  presentImportDialog(browserWindow) {
    const opts = {
      title: 'Import Protocol',
      properties: ['openFile'],
      filters: [
        { name: 'Protocols', extensions: validFileExts },
      ],
    };
    return new Promise((resolve, reject) => {
      dialog.showOpenDialog(browserWindow, opts, (filePaths) => {
        if (!filePaths) {
          // User cancelled
          resolve();
          return;
        }
        this.validateAndImport(filePaths)
          .then(savedFilename => resolve(savedFilename))
          .catch(err => reject(err));
      });
    });
  }

  /**
   * Import a file from a user-specified location to the working app directory.
   * Primary interface for render-side API.
   * @async
   * @param  {FileList} fileList
   * @return {string} Resolves with the original requested filename
   * @throws {RequestError|Error} Rejects if there is a problem saving, or on invalid input
   */
  validateAndImport(fileList) {
    if (!fileList || fileList.length < 1) {
      return Promise.reject(new RequestError(ErrorMessages.EmptyFilelist));
    }

    if (fileList.length > 1) {
      return Promise.reject(new RequestError(ErrorMessages.FilelistNotSingular));
    }

    const userFilepath = fileList[0]; // User's file; treat as read-only

    if (!hasValidExtension(userFilepath)) {
      return Promise.reject(new RequestError(ErrorMessages.InvalidContainerFileExtension));
    }

    let tempFilepath;
    return this.ensureDataDir()
      .then(() => this.importFile(userFilepath))
      .then(({ tempPath, destPath, protocolName }) => {
        tempFilepath = tempPath;
        return this.processFile(tempPath, destPath, protocolName);
      })
      .catch((err) => {
        // Clean up tmp file on error
        if (tempFilepath) tryUnlink(tempFilepath);
        throw err;
      })
      .then(() => {
        // Clean up tmp file if update was a no-op
        if (tempFilepath) tryUnlink(tempFilepath);
      })
      .then(() => path.basename(userFilepath));
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
   * Import a file from a user-specified location to the working app directory.
   * The file is saved with a random, unique name; until parsed,
   * we don't know whether this is a new or updated protocol.
   * @async
   * @param  {string} filepath of existing file on local disk
   * @return {string} The saved filepath.
   * @throws {RequestError|Error} if the file to import isn't found
   */
  importFile(localFilepath = '') {
    return new Promise((resolve, reject) => {
      const parsedPath = path.parse(localFilepath);

      if (!parsedPath.base) {
        reject(new RequestError(ErrorMessages.InvalidContainerFile));
        return;
      }

      const protocolName = parsedPath.name;
      const destPath = this.pathToProtocolFile(`${parsedPath.base}`);
      try {
        // If protocol file already exists in Server, do not allow update
        if (fs.existsSync(destPath)) {
          throw new RequestError(ErrorMessages.ProtocolAlreadyExists);
        }
      } catch (fsErr) {
        if (fsErr instanceof RequestError) {
          logger.debug(`Protocol already imported to Server: ${protocolName}`);
          throw fsErr;
        }
      }

      const tempName = `${uuid()}${parsedPath.ext}`;
      const tempPath = this.pathToProtocolFile(tempName);

      fs.copyFile(localFilepath, tempPath, (err) => {
        if (err) {
          reject(err);
        }
        resolve({ tempPath, destPath, protocolName });
      });
    });
  }

  /**
   * Process the imported (tmp) file:
   * 1. Read file contents
   * 2. Calculate a sha-256 digest of contents
   * 3. Extract & parse protocol.json
   * 4. Move (rename) tmpfile to final file location
   * 5. Persist metadata to DB
   *
   * @async
   * @param  {string} savedFilepath
   * @return {string} Resolves with the base name of the persisted file
   * @throws Rejects if the file is not saved or protocol is invalid
   */
  async processFile(tmpFilepath, destFilepath, protocolName) {
    let fileContents;
    const cleanUpAndThrow = err => tryUnlink(destFilepath).then(() => { throw err; });

    try {
      fileContents = await readFile(tmpFilepath);
    } catch (unexpectedErr) {
      logger.error(unexpectedErr);
      return cleanUpAndThrow(unexpectedErr);
    }

    if (!fileContents || !fileContents.length) {
      return cleanUpAndThrow(new RequestError(ErrorMessages.InvalidContainerFile));
    }

    const destFilename = path.basename(destFilepath);
    const digest = hexDigest(fileContents);

    let protocolContents;
    let zip;
    try {
      zip = await jszip.loadAsync(fileContents);
    } catch (zipErr) {
      return cleanUpAndThrow(new RequestError(ErrorMessages.InvalidZip));
    }

    const zippedProtocol = zip.files[ProtocolDataFile];
    if (!zippedProtocol) {
      return cleanUpAndThrow(new RequestError(ErrorMessages.MissingProtocolFile));
    }

    try {
      protocolContents = await zippedProtocol.async('string');
    } catch (zipErr) {
      return cleanUpAndThrow(new RequestError(ErrorMessages.InvalidZip));
    }

    let json;
    try {
      json = JSON.parse(protocolContents);
      json = { ...json, name: protocolName }; // file name becomes protocol name
    } catch (parseErr) {
      return cleanUpAndThrow(new Error(`${ErrorMessages.InvalidProtocolFormat}: could not parse JSON`));
    }

    // By basing name on contents, we can short-circuit later updates that didn't change the file.
    // This must happen after validating JSON contents.
    // If rename fails for some reason, just continue.
    try {
      await rename(tmpFilepath, destFilepath);
    } catch (fsErr) {
      logger.debug('rename error; continuing.', fsErr);
    }

    // Persist metadata.
    try {
      await this.db.save(destFilename, digest, json);
    } catch (dbErr) {
      return cleanUpAndThrow(dbErr);
    }

    return destFilename;
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
    return this.allProtocols()
      .then(protocols => protocols.map(p => this.destroyProtocol(p)))
      .then(promises => Promise.all(promises))
      .catch((err) => {
        logger.error(err);
        throw err;
      });
  }

  /**
   * Destroy both metadata from DB and saved file
   * Does not destroy associated sessions.
   * @param {object} protocol
   * @param {Boolean} ensureFileDeleted If true and the file could not be deleted, rejects.
   * @async
   * @return {Boolean} Resolves with true
   * @throws {Error} on any DB error, or file error if ensureFileDeleted==true
   */
  destroyProtocol(protocol, ensureFileDeleted = false) {
    return new Promise((resolve, reject) => {
      const filePath = this.pathToProtocolFile(protocol.filename);
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
   * @throws {RequestError|Error} If file doesn't exist (ErrorMessages.NotFound),
   *         or there is an error reading
   */
  fileContents(savedFileName) {
    return new Promise((resolve, reject) => {
      if (typeof savedFileName !== 'string') {
        reject(new RequestError(ErrorMessages.InvalidContainerFile));
        return;
      }
      const filePath = this.pathToProtocolFile(savedFileName);

      // Prevent escaping protocol directory
      if (filePath.indexOf(this.protocolDir) !== 0) {
        reject(new RequestError(ErrorMessages.InvalidContainerFile));
        return;
      }

      fs.readFile(filePath, (err, dataBuffer) => {
        if (err) {
          if (err.code === 'ENOENT') {
            reject(new RequestError(ErrorMessages.NotFound));
          } else {
            reject(err);
          }
          return;
        }
        resolve(dataBuffer);
      });
    });
  }

  /**
   * Get all sessions, up to an optional limit, for a protocol
   * @param {string} protocolId
   * @param {number?} limit
   * @async
   * @return {array}
   */
  getProtocolSessions(protocolId, limit) {
    return this.sessionDb.findAll(protocolId, limit);
  }

  /**
   * Delete one or more sessions from a protocol
   * @param {string} protocolId ID of an existing protocol
   * @param {string?} sessionId if provided, delete only the specific ID.
   *                            If omitted, delete all sessions for the protocol.
   * @async
   * @return {number} removed count
   */
  deleteProtocolSessions(protocolId, sessionId = null) {
    return this.sessionDb.delete(protocolId, sessionId);
  }

  /**
   * Import data associated with a protocol
   * @param {string} protocolId ID of an existing protocol
   * @param {object|array} sessionOrSessions one or more sessions of arbitrary shape
   * @async
   */
  addSessionData(protocolId, sessionOrSessions) {
    return this.getProtocol(protocolId)
      .then((protocol) => {
        if (!protocol) {
          throw new RequestError(ErrorMessages.ProtocolNotFoundForSession);
        }
        return this.sessionDb.insertAllForProtocol(sessionOrSessions, protocol);
      })
      .catch((insertErr) => {
        logger.error(insertErr);
        throw insertErr;
      });
  }

  // TODO: Probably remove after alpha testing
  destroyAllSessions() {
    return this.sessionDb.deleteAll();
  }
}

Object.freeze(ErrorMessages);
ProtocolManager.ErrorMessages = ErrorMessages;

module.exports = ProtocolManager;
