import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';
import { groupBy } from 'lodash';
import { bindActionCreators } from 'redux';
import { connect, useDispatch } from 'react-redux';
import { ipcRenderer } from 'electron';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon, Spinner, ProgressBar, Button } from '@codaco/ui';
import { getCSSVariableAsNumber } from '@codaco/ui/lib/utils/CSSVariables';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import { actionCreators as toastActions } from '../ducks/modules/toasts';
import AdminApiClient from '../utils/adminApiClient';

const IPC = {
  SESSIONS_IMPORTED: 'SESSIONS_IMPORTED',
  SESSIONS_IMPORT_STARTED: 'SESSIONS_IMPORT_STARTED',
  SESSIONS_IMPORT_COMPLETE: 'SESSIONS_IMPORT_COMPLETE',
};

const NewFileDropTarget = ({
  children,
  openDialog,
}) => {
  const apiClient = new AdminApiClient();
  const [isImporting, setIsImporting] = useState(false);

  const sessionImportToastID = 'session-import';

  const dispatch = useDispatch();

  const showStartSessionImportToast = () => {
    dispatch(toastActions.addToast({
      id: sessionImportToastID,
      type: 'info',
      title: 'Importing sessions...',
      CustomIcon: (<Spinner small />),
      autoDismiss: false,
      content: (
        <React.Fragment>
          <ProgressBar orientation="horizontal" percentProgress={10} />
        </React.Fragment>
      ),
    }));
  };

  const showCancellationToast = () => {
    dispatch(toastActions.addToast({
      type: 'warning',
      title: 'Import cancelled',
      content: (
        <React.Fragment>
          <p>You cancelled session import.</p>
        </React.Fragment>
      ),
    }));
  };

  const showUpdateToast = (update) => {
    ipcRenderer.on(IPC.SESSIONS_IMPORT_COMPLETE, () => {
      dispatch(toastActions.updateToast('sessionImportToast', {
        title: 'Still importing...',
        content: (
          <React.Fragment>
            <ProgressBar orientation="horizontal" percentProgress={update.progress} />
          </React.Fragment>
        ),
      }));
    });
  };

  const showCompleteToast = (message, numberSucceeded, importErrors, fileErrors) => {
    // Remove the 'in-progress' toast
    dispatch(toastActions.removeToast(sessionImportToastID));

    // If we have no import errors or file errors, just show a success dialog
    if (importErrors.length > 0 || fileErrors.length > 0) {
      const importErrorsByFile = groupBy(importErrors, 'file');

      const showMoreInfo = () => openDialog({
        type: 'Error',
        canCancel: false,
        title: 'Import error details',
        onConfirm: () => dispatch(toastActions.removeToast('import-result')),
        message: (
          <React.Fragment>
            <p>
              Errors were encountered when trying to import the files and sessions you
              selected. Expand the error types below to see specific details.
            </p>
            <div className="import-error-details">
              { importErrors.length > 0 && (
                <details className="error-section">
                  <summary> <h2>Session errors ({importErrors.length})</h2></summary>
                  {Object.keys(importErrorsByFile).map(fileWithError => (
                    <div className="error-item">
                      <h4>
                        <span role="img" aria-label="warning">⚠️</span> {fileWithError}:
                      </h4>
                      <ul>
                        {importErrorsByFile[fileWithError].map(importFileError =>
                          <li>{importFileError.caseID ? `Case ID: ${importFileError.caseID} - ` : null}{importFileError.message}</li>)}
                      </ul>
                    </div>
                  ))}
                </details>
              )}
              { fileErrors.length > 0 && (
                <details className="error-section">
                  <summary><h2>File errors ({fileErrors.length})</h2></summary>
                  {fileErrors.map(fileWithError => (
                    <div className="error-item">
                      <h4>
                        <span role="img" aria-label="warning">⚠️</span> {fileWithError.file}: {fileWithError.message}
                      </h4>
                    </div>
                  ))}
                </details>
              )}
            </div>
          </React.Fragment>
        ),
      });

      dispatch(toastActions.addToast({
        id: 'import-result',
        type: 'warning',
        title: 'Finished with errors',
        autoDismiss: false,
        content: (
          <React.Fragment>
            <p>
              The import process finished, but errors were encountered with some files or
              sessions. Click &quot;more information&quot; to see details.
            </p>
            <p>
              <span role="img" aria-label="success">✔️</span> {numberSucceeded} session(s) imported successfully.
            </p>
            <p>
              <span role="img" aria-label="warning">⚠️</span> { importErrors.length + fileErrors.length} files or sessions enountered an
              error during import.
            </p>
            <div className="toast-button-group">
              <Button size="small" color="platinum" onClick={() => dispatch(toastActions.removeToast('import-result'))}>Dismiss</Button>
              <Button color="neon-coral" size="small" onClick={showMoreInfo}>More Information</Button>
            </div>
          </React.Fragment>
        ),
      }));
      return;
    }

    dispatch(toastActions.addToast({
      type: 'success',
      title: 'Finished!',
      content: (
        <React.Fragment>
          <p>{message}</p>
        </React.Fragment>
      ),
    }));
  };

  const showErrorDialog = (message, errors) => {
    dispatch(toastActions.removeToast(sessionImportToastID));

    openDialog({
      type: 'Error',
      canCancel: false,
      title: 'Import Failed',
      message: (
        <React.Fragment>
          <strong>{message}</strong>
          <pre>{errors}</pre>
        </React.Fragment>
      ),
    });
  };

  const onDrop = useCallback((acceptedFiles) => {
    setIsImporting(true);
    showStartSessionImportToast();

    apiClient
      .post('/importFiles', { files: acceptedFiles.map(file => file.path) })
      .then((result) => {
        // See src/main/data-managers/ProtocolManager.js:374
        const {
          message, // User readable result of the API request.
          importedSessions, // Array of session IDs for sucessfully imported sessions
          sessionErrors, // Collection of error objects with error details
          invalidFileErrors, // ?
        } = result;

        setIsImporting(false);
        showCompleteToast(message, importedSessions.length, sessionErrors, invalidFileErrors);
      })
      .catch(({ message, error }) => {
        setIsImporting(false);
        showErrorDialog(message, error);
      });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop,
  });

  const slowDuration = getCSSVariableAsNumber('--animation-duration-slow-ms') / 1000;
  const fastDuration = getCSSVariableAsNumber('--animation-duration-fast-ms') / 1000;

  const variants = {
    show: {
      opacity: 1,
      transition: {
        duration: fastDuration,
        when: 'beforeChildren',
      },
    },
    hidden: {
      opacity: 0,
      transition: {
        duration: fastDuration,
      },
    },
  };

  const spring = {
    type: 'spring',
    damping: 10,
    stiffness: 100,
    duration: slowDuration,
    when: 'beforeChildren',
  };

  return (
    <div {...getRootProps()} style={{ flex: 1, overflowY: 'auto' }}>
      <input {...getInputProps()} />
      <AnimatePresence>
        { isDragActive && !isImporting &&
          <motion.div
            className="file-drop-target__overlay"
            animate="show"
            initial="hidden"
            exit="hidden"
            variants={variants}
          >
            <motion.div
              className="file-drop-target__info"
              animate={{ scale: 1 }}
              initial={{ scale: 0 }}
              transition={spring}
            >
              <div className="session-fan">
                <motion.div animate={{ rotate: 10, x: 15 }} transition={{ delay: 0.15, type: 'spring' }} className="mock-session" />
                <motion.div animate={{ rotate: -10, x: -15 }} transition={{ delay: 0.15, type: 'spring' }} className="mock-session" />
                <motion.div className="mock-session" />
                <Icon name="menu-download-data" />
              </div>
              <h2>Import interview sessions to Server</h2>
              <p>
                Drop <code>.graphml</code> session files from Network Canvas here
                to import them into Server.
              </p>
            </motion.div>
          </motion.div>
        }
      </AnimatePresence>
      { children }
    </div>
  );
};

NewFileDropTarget.defaultProps = {
  children: null,
  openDialog: () => {},
};

NewFileDropTarget.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  openDialog: PropTypes.func,
};

const mapDispatchToProps = dispatch => ({
  loadProtocols: bindActionCreators(protocolActionCreators.loadProtocols, dispatch),
  openDialog: bindActionCreators(dialogActions.openDialog, dispatch),
});

export default connect(null, mapDispatchToProps)(NewFileDropTarget);
