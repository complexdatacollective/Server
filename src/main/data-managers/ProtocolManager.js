const { dialog } = require('electron');
const fs = require('fs');
const jszip = require('jszip');
const logger = require('electron-log');
const path = require('path');
const uuid = require('uuid/v4');
const ProtocolDB = require('./ProtocolDB');
const SessionDB = require('./SessionDB');
const { ErrorMessages, RequestError } = require('../errors/RequestError');
const { readFile, rename, tryUnlink } = require('../utils/promised-fs');
const { validateGraphML, convertGraphML } = require('../utils/importGraphML');
const { hexDigest } = require('../utils/sha256');
const { sendToGui } = require('../guiProxy');

const validProtocolFileExts = ['netcanvas'];
const validSessionFileExts = ['graphml'];
const protocolDirName = 'protocols';

const ProtocolDataFile = 'protocol.json';

const hasValidProtocolExtension = filepath => validProtocolFileExts.includes(path.extname(filepath).replace(/^\./, ''));
const hasValidSessionExtension = filepath => validSessionFileExts.includes(path.extname(filepath).replace(/^\./, ''));

const emittedEvents = {
  PROTOCOLS_IMPORT_STARTED: 'PROTOCOLS_IMPORT_STARTED',
  PROTOCOLS_IMPORT_COMPLETE: 'PROTOCOLS_IMPORT_COMPLETE',
  SESSIONS_IMPORT_STARTED: 'SESSIONS_IMPORT_STARTED',
  SESSIONS_IMPORT_COMPLETE: 'SESSIONS_IMPORT_COMPLETE',
};

/**
 * Interface to protocol data (higher-level than DB)
 */
class ProtocolManager {
  constructor(dataDir) {
    this.protocolDir = path.join(dataDir, protocolDirName);
    this.presentImportProtocolDialog = this.presentImportProtocolDialog.bind(this);
    this.presentImportSessionDialog = this.presentImportSessionDialog.bind(this);
    this.validateAndImportProtocols = this.validateAndImportProtocols.bind(this);

    const dbFile = path.join(dataDir, 'db', 'protocols.db');
    this.db = new ProtocolDB(dbFile);

    const sessionDbFile = path.join(dataDir, 'db', 'sessions.db');
    this.sessionDb = new SessionDB(sessionDbFile);
    this.reportDb = this.sessionDb;
  }

  pathToProtocolFile(filename, dir = this.protocolDir) {
    return path.join(dir, filename);
  }

  /**
   * Primary entry for native UI (e.g., File -> Import).
   * Display an Open dialog for the user to select importable files.
   * @async
   * @return {string|undefined} Resolves with the original requested filename, or
   *                                     `undefined` if no files were selected
   * @throws {Error} If importing of any input file failed
   */
  presentImportProtocolDialog(browserWindow) {
    const opts = {
      title: 'Import Protocol',
      properties: ['openFile'],
      filters: [
        { name: 'Protocols', extensions: validProtocolFileExts },
      ],
    };

    return dialog.showOpenDialog(browserWindow, opts)
      .then(({ canceled, filePaths }) => {
        if (canceled) {
          return { filesnames: null, errorMessages: null };
        }

        return this.validateAndImportProtocols(filePaths);
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
  validateAndImportProtocols(fileList) {
    if (!fileList || fileList.length < 1) {
      return Promise.reject(new RequestError(ErrorMessages.EmptyFilelist));
    }

    const promisedImports = fileList.map((userFilepath) => {
      const fileBasename = userFilepath && path.basename(userFilepath);

      if (!hasValidProtocolExtension(userFilepath)) {
        return Promise.reject(new RequestError(`${fileBasename} - ${ErrorMessages.InvalidContainerFileExtension}`));
      }

      sendToGui(emittedEvents.PROTOCOLS_IMPORT_STARTED);

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
        .then(() => fileBasename);
    });

    return Promise.allSettled(promisedImports)
      .then((importedPaths) => {
        // Remove any imports that failed
        const validImportedProtocolFiles = importedPaths
          .filter(protocolPath => protocolPath.status === 'fulfilled')
          .map(filteredPath => filteredPath.value);

        const invalidImportedFileErrors = importedPaths
          .filter(protocolPath => protocolPath.status === 'rejected')
          .map(filteredPath => filteredPath.reason.message)
          .join('; ');

        sendToGui(emittedEvents.PROTOCOLS_IMPORT_COMPLETE);
        // FatalError if no sessions survived the cull
        if (validImportedProtocolFiles.length === 0) {
          throw new RequestError(invalidImportedFileErrors);
        }

        return { filenames: validImportedProtocolFiles.join(', '), errorMessages: invalidImportedFileErrors };
      });
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
        reject(new RequestError(`${ErrorMessages.InvalidContainerFile}: ${localFilepath}`));
        return;
      }

      const protocolName = parsedPath.name;
      const destPath = this.pathToProtocolFile(`${parsedPath.base}`);
      try {
        // If protocol file already exists in Server, do not allow update
        if (fs.existsSync(destPath)) {
          throw new RequestError(`${ErrorMessages.ProtocolAlreadyExists}: ${protocolName}`);
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
      return cleanUpAndThrow(new RequestError(`${ErrorMessages.InvalidContainerFile}: ${destFilepath && path.parse(destFilepath).base}`));
    }

    const destFilename = path.basename(destFilepath);
    const digest = hexDigest(fileContents);

    let protocolContents;
    let zip;
    try {
      zip = await jszip.loadAsync(fileContents);
    } catch (zipErr) {
      return cleanUpAndThrow(new RequestError(`${ErrorMessages.InvalidZip}: ${path.parse(destFilepath).base}`));
    }

    const zippedProtocol = zip.files[ProtocolDataFile];
    if (!zippedProtocol) {
      return cleanUpAndThrow(new RequestError(`${ErrorMessages.MissingProtocolFile}: ${path.parse(destFilepath).base}`));
    }

    try {
      protocolContents = await zippedProtocol.async('string');
    } catch (zipErr) {
      return cleanUpAndThrow(new RequestError(`${ErrorMessages.InvalidZip}: ${path.parse(destFilepath).base}`));
    }

    let json;
    try {
      json = JSON.parse(protocolContents);
      json = { ...json, name: protocolName }; // file name becomes protocol name
    } catch (parseErr) {
      return cleanUpAndThrow(new Error(`${path.parse(destFilepath).base} - ${ErrorMessages.InvalidProtocolFormat}: could not parse JSON`));
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
  fileContents(savedFileName, dir = this.protocolDir) {
    return new Promise((resolve, reject) => {
      if (typeof savedFileName !== 'string') {
        reject(new RequestError(`${ErrorMessages.InvalidContainerFile}: savedFileName`));
        return;
      }
      const filePath = this.pathToProtocolFile(savedFileName, dir);

      // Prevent escaping protocol directory
      if (filePath.indexOf(dir) !== 0) {
        reject(new RequestError(`${ErrorMessages.InvalidContainerFile}: ${path.parse(savedFileName).base}`));
        return;
      }

      fs.readFile(filePath, (err, dataBuffer) => {
        if (err) {
          if (err.code === 'ENOENT') {
            reject(new RequestError(`${ErrorMessages.NotFound}: ${path.parse(savedFileName).base}`));
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
     * Read graphml and/or netcanvas files from a user-specified location.
     * Primary interface for render-side API.
     * @async
     * @param  {FileList} fileList
     * @return {object} Resolves with filenames of successful imports and errors for failures
     * @throws {RequestError|Error} Rejects if there is a problem uploading, or on invalid input
     */
  handleImportedFiles(fileList) {
    const protocolFileList = fileList.filter(
      filepath => hasValidProtocolExtension(filepath && path.basename(filepath)));
    const sessionFileList = fileList.filter(
      filepath => hasValidSessionExtension(filepath && path.basename(filepath)));
    const invalidFileList = fileList.filter(filepath =>
      !hasValidSessionExtension(filepath && path.basename(filepath)) &&
      !hasValidProtocolExtension(filepath && path.basename(filepath)))
      .map(filepath => path.basename(filepath));

    const processFilePromises = [];
    if (protocolFileList.length > 0) {
      processFilePromises.push(this.validateAndImportProtocols(protocolFileList));
    } else {
      processFilePromises.push(Promise.resolve({ filenames: '', errorMessages: '' }));
    }
    if (sessionFileList.length > 0) {
      processFilePromises.push(this.processSessionFiles(sessionFileList));
    } else {
      processFilePromises.push(Promise.resolve({ filenames: '', errorMessages: '' }));
    }
    if (invalidFileList.length > 0) {
      processFilePromises.push(Promise.reject(new RequestError(`${ErrorMessages.InvalidFileExtension}: ${invalidFileList.join(', ')}`)));
    } else {
      processFilePromises.push(Promise.resolve());
    }
    return Promise.allSettled(processFilePromises)
      .then((results) => {
        const importedProtocols = results[0].status === 'fulfilled' ? results[0].value.filenames : '';
        const protocolErrors = results[0].status === 'fulfilled' ? results[0].value.errorMessages : results[0].reason.message;
        const importedSessions = results[1].status === 'fulfilled' ? results[1].value.filenames : '';
        const sessionErrors = results[1].status === 'fulfilled' ? results[1].value.errorMessages : results[1].reason.message;
        const invalidFileErrors = results[2].status === 'rejected' ? results[2].reason.message : '';
        return {
          importedProtocols,
          protocolErrors,
          importedSessions,
          sessionErrors,
          invalidFileErrors,
        };
      });
  }

  /**
 * Primary entry for native UI (e.g., File -> Import).
 * Display an Open dialog for the user to select importable files.
 * @async
 * @return {string|undefined} Resolves with the original requested filename, or
 *                                     `undefined` if no files were selected
 * @throws {Error} If importing of any input file failed
 */
  presentImportSessionDialog(browserWindow) {
    const opts = {
      title: 'Import Case',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Graphml', extensions: validSessionFileExts },
      ],
    };

    return dialog.showOpenDialog(browserWindow, opts)
      .then(({ canceled, filePaths }) => {
        if (canceled) {
          return { filesnames: null, errorMessages: null };
        }

        return this.processSessionFiles(filePaths);
      });
  }

  /**
     * Read a graphml file from a user-specified location.
     * Primary interface for render-side API.
     * @async
     * @param  {FileList} fileList
     * @return {string} Resolves with the original requested filename
     * @throws {RequestError|Error} Rejects if there is a problem uploading, or on invalid input
     */
  processSessionFiles(fileList) {
    if (!fileList || fileList.length < 1) {
      return Promise.reject(new RequestError(ErrorMessages.EmptyFilelist));
    }

    const promisedImports = fileList.map((userFilepath) => {
      const fileBasename = userFilepath && path.basename(userFilepath);

      if (!hasValidSessionExtension(userFilepath)) {
        return Promise.reject(new RequestError(`${fileBasename} - ${ErrorMessages.InvalidSessionFileExtension}`));
      }

      sendToGui(emittedEvents.SESSIONS_IMPORT_STARTED);

      return (this.fileContents(userFilepath, ''))
        .then(bufferContents => validateGraphML(bufferContents))
        .then(xmlDoc => this.processGraphML(xmlDoc))
        .then(({ protocolId, sessions }) => sessions.map(
          session => this.addSessionData(protocolId, session)))
        .then(addSessionPromises => Promise.allSettled(addSessionPromises))
        .then((importedSessions) => {
          const validImportedSessions = importedSessions
            .filter(sessionPath => sessionPath.status === 'fulfilled')
            .map(filteredPath => filteredPath.value);
          const invalidImportedSessionErrors = importedSessions
            .filter(sessionPath => sessionPath.status === 'rejected')
            .map(filteredPath => filteredPath.reason.message)
            .join(';\n');

          if (validImportedSessions.length === 0) {
            throw new RequestError(`${importedSessions.length} failed: ${invalidImportedSessionErrors}`);
          }
          return {
            fileBasename,
            numSessionsSucceeded: validImportedSessions.length,
            numSessionsFailed: importedSessions.length - validImportedSessions.length,
            invalidImportedSessionErrors,
          };
        })
        .catch(err => Promise.reject(new RequestError(`${fileBasename} - ${err.message || ErrorMessages.InvalidSessionFormat}`)));
    });

    return Promise.allSettled(promisedImports)
      .then((importedPaths) => {
        // Remove any imports that failed
        const validImportedSessionFiles = importedPaths
          .filter(sessionPath => sessionPath.status === 'fulfilled')
          .map(filteredPath => filteredPath.value && `${filteredPath.value.numSessionsSucceeded} from ${filteredPath.value.fileBasename}`);

        const invalidSessionsFromValidFiles = importedPaths
          .filter(sessionPath => sessionPath.status === 'fulfilled' && sessionPath.value && sessionPath.value.numSessionsFailed)
          .map(filteredPath => `${filteredPath.value.numSessionsFailed} failed from ${filteredPath.value.fileBasename} with: ${filteredPath.value.invalidImportedSessionErrors}`)
          .join('; ');

        const invalidImportedFileErrors = importedPaths
          .filter(sessionPath => sessionPath.status === 'rejected')
          .map(filteredPath => filteredPath.reason.message)
          .join('; ');

        sendToGui(emittedEvents.SESSIONS_IMPORT_COMPLETE);
        // FatalError if no sessions survived the cull
        if (validImportedSessionFiles.length === 0) {
          throw new RequestError(invalidImportedFileErrors);
        }

        let allErrors = invalidSessionsFromValidFiles ? `${invalidSessionsFromValidFiles}. ` : '';
        allErrors += invalidImportedFileErrors;
        return { filenames: validImportedSessionFiles.join(', '), errorMessages: allErrors };
      });
  }

  processGraphML(xmlDoc) {
    const graphml = xmlDoc.getElementsByTagName('graphml');
    const graphs = graphml[0].getElementsByTagName('graph');
    const protocolId = graphs && graphs[0].getAttribute('nc:remoteProtocolID');
    const protocolName = graphs && graphs[0].getAttribute('nc:protocolName');

    return this.getProtocol(protocolId)
      .then((protocol) => {
        if (!protocol) {
          throw new RequestError(`${ErrorMessages.ProtocolNotFoundForSession}: ${protocolName}`);
        }
        return convertGraphML(xmlDoc, protocol);
      });
  }

  /**
   * Get all sessions, up to an optional limit, for a protocol
   * @param {string} protocolId
   * @param {number?} limit
   * @async
   * @return {array}
   */
  getProtocolSessions(protocolId, limit, sort, filterValue) {
    return this.sessionDb.findAll(protocolId, limit, undefined, sort, filterValue);
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
    const session = Array.isArray(sessionOrSessions) ? sessionOrSessions[0] : sessionOrSessions;
    return this.getProtocol(protocolId)
      .then((protocol) => {
        if (!protocol) {
          const protocolName = (session && session.data && session.data.sessionVariables &&
            session.data.sessionVariables.protocolName) || 'undefined';
          throw new RequestError(`${ErrorMessages.ProtocolNotFoundForSession} - ${protocolName}`);
        }
        return this.sessionDb.insertAllForProtocol(sessionOrSessions, protocol);
      })
      .catch((insertErr) => {
        logger.error(insertErr);
        if (insertErr.errorType === 'uniqueViolated') {
          throw new RequestError(`${ErrorMessages.SessionAlreadyExists}:
            ${session && session.data && session.data.sessionVariables && session.data.sessionVariables.caseId}`);
        }
        throw insertErr;
      });
  }

  destroyAllSessions() {
    return this.sessionDb.deleteAll();
  }
}

Object.freeze(ErrorMessages);
ProtocolManager.ErrorMessages = ErrorMessages;

module.exports = ProtocolManager;
