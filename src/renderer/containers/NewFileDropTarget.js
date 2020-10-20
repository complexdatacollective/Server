import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@codaco/ui';
import { getCSSVariableAsNumber } from '@codaco/ui/lib/utils/CSSVariables';
// import AdminApiClient from '../utils/adminApiClient';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import AdminApiClient from '../utils/adminApiClient';

const NewFileDropTarget = ({
  children,
  openDialog,
}) => {
  const apiClient = new AdminApiClient();

  const showErrorDialog = (error) => {
    openDialog({
      type: 'Error',
      canCancel: false,
      title: 'Import Error',
      message: error,
    });
  };

  const onDrop = useCallback((acceptedFiles) => {
    apiClient
      .post('/importFiles', { files: acceptedFiles.map(file => file.path) })
      .then(resp => ({ filenames: resp.filenames, errorMessages: resp.message }))
      .then(({ errorMessages }) => {
        if (errorMessages) showErrorDialog(errorMessages);
      })
      // .then(() => loadProtocols())
      .catch(err => showErrorDialog(err.message || 'Could not save file'));
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
        { isDragActive &&
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
              <h2>Import sessions to Server</h2>
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
