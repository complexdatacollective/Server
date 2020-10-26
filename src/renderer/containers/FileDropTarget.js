/* eslint
no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["evt"] }] */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import { ipcRenderer } from 'electron';
import { Icon, Spinner, ProgressBar } from '@codaco/ui';
import { getCSSVariableAsNumber } from '@codaco/ui/lib/utils/CSSVariables';
import AdminApiClient from '../utils/adminApiClient';
import { actionCreators as toastActions } from '../ducks/modules/toasts';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';

const onDragOver = (evt) => {
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
};

const IPC = {
  PROTOCOL_IMPORT_START: 'PROTOCOL_IMPORT_START',
  PROTOCOL_IMPORT_SUCCESS: 'PROTOCOL_IMPORT_SUCCESS',
  PROTOCOL_IMPORT_FAILURE: 'PROTOCOL_IMPORT_FAILURE',
};

class FileDropTarget extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.apiClient = new AdminApiClient();
    this.onDrop = this.onDrop.bind(this);
    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    ipcRenderer.on(IPC.PROTOCOL_IMPORT_START, this.showStartProtocolImportToast);
    ipcRenderer.on(IPC.PROTOCOL_IMPORT_FAILURE, this.showProtocolImportFailureToast);
    ipcRenderer.on(IPC.PROTOCOL_IMPORT_SUCCESS, this.showCompleteProtocolImportToast);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(IPC.PROTOCOL_IMPORT_START, this.showStartProtocolImportToast);
    ipcRenderer.removeListener(IPC.PROTOCOL_IMPORT_FAILURE, this.showProtocolImportFailureToast);
    ipcRenderer.removeListener(IPC.PROTOCOL_IMPORT_SUCCESS, this.showCompleteProtocolImportToast);
  }

  onDragEnter() {
    this.setState({ draggingOver: true });
  }

  onDragLeave(evt) {
    evt.stopPropagation();
    // Ignore event if dragging over a contained child (where evt.target is the child)
    if (this.containerRef.current === evt.target || (this.props.isOverlay && evt.target.className === 'file-drop-target__overlay')) {
      this.setState({ draggingOver: false });
    }
  }

  onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const { loadProtocols } = this.props;

    const fileList = evt.dataTransfer.files;
    const files = [];
    for (let i = 0; i < fileList.length; i += 1) {
      files.push(fileList[i].path);
    }

    // If the user drags a file attachment from a browser, we get a url instead of a file
    if (!files || files.length < 1) {
      const urlName = evt.dataTransfer.getData && evt.dataTransfer.getData('URL');
      if (urlName) {
        this.setState({ draggingOver: false });
        this.showErrorDialog('Dragging files into Server from this source is not currently supported. Please download the file to your computer and try again.');
        return;
      }
    }

    this.setState({ draggingOver: false });
    this.apiClient
      .post('/importProtocols', { files })
      .then(() => loadProtocols()) // Refresh protocols
      .catch(err => this.showErrorDialog(err.message || 'Could not save file'));
  }

  showErrorDialog = (error) => {
    this.props.openDialog({
      type: 'Warning',
      canCancel: false,
      title: 'Import Error',
      message: error,
    });
  }

  showStartProtocolImportToast = (_, fileBasename) => {
    this.props.addToast({
      id: fileBasename,
      type: 'info',
      title: 'Importing...',
      CustomIcon: (<Spinner small />),
      autoDismiss: false,
      content: (
        <React.Fragment>
          <p>
            Importing {fileBasename}...
          </p>
          <ProgressBar orientation="horizontal" percentProgress={30} />
        </React.Fragment>
      ),
    });
  };

  showProtocolImportFailureToast = (_, fileBasename, err) => {
    this.props.updateToast(fileBasename, {
      type: 'warning',
      title: 'Import failed',
      CustomIcon: (<Icon name="error" />),
      autoDismiss: false,
      content: (
        <React.Fragment>
          <p>
            Importing {fileBasename} failed!
          </p>
          <strong>Error details:</strong>
          <p>{(err && err.message) || err}</p>
        </React.Fragment>
      ),
    });
  };

  showCompleteProtocolImportToast = (_, fileBasename, protocolName) => {
    this.props.removeToast(fileBasename);

    this.props.addToast({
      type: 'success',
      title: 'Import protocol complete!',
      content: (
        <React.Fragment>
          <p>
            The protocol &quot;{protocolName}&quot; was imported successfully.
          </p>
        </React.Fragment>
      ),
    });
  };

  render() {
    const { draggingOver } = this.state;
    const { isOverlay } = this.props;
    const containerProps = {
      className: 'file-drop-target',
      onDragEnter: this.onDragEnter,
      onDragLeave: this.onDragLeave,
      onDragOver,
      onDrop: this.onDrop,
    };
    if (!isOverlay && draggingOver) {
      containerProps.className += ' file-drop-target--active';
    }

    const slowDuration = getCSSVariableAsNumber('--animation-duration-slow-ms') / 1000;
    const fastDuration = getCSSVariableAsNumber('--animation-duration-fast-ms') / 1000;
    const variants = {
      show: {
        opacity: 1,
        transition: {
          duration: fastDuration,
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
    };

    return (
      <div {...containerProps} ref={this.containerRef}>
        <AnimatePresence>
          {(draggingOver && isOverlay) &&
            <motion.div
              className="file-drop-target__overlay"
              animate="show"
              initial="hidden"
              exit="hidden"
              variants={variants}
            >
              <motion.div
                animate={{ scale: 2 }}
                transition={spring}
              >
                <Icon name="menu-download-data" />
                <h4>Import sessions to Server</h4>
              </motion.div>
            </motion.div>
          }
        </AnimatePresence>
        { this.props.children }
      </div>
    );
  }
}

FileDropTarget.defaultProps = {
  children: null,
  isOverlay: false,
  loadProtocols: () => {},
  openDialog: () => {},
};

FileDropTarget.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  isOverlay: PropTypes.bool,
  loadProtocols: PropTypes.func,
  openDialog: PropTypes.func,
  addToast: PropTypes.func.isRequired,
  removeToast: PropTypes.func.isRequired,
  updateToast: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  loadProtocols: bindActionCreators(protocolActionCreators.loadProtocols, dispatch),
  openDialog: bindActionCreators(dialogActions.openDialog, dispatch),
  addToast: bindActionCreators(toastActions.addToast, dispatch),
  removeToast: bindActionCreators(toastActions.removeToast, dispatch),
  updateToast: bindActionCreators(toastActions.updateToast, dispatch),
});

export default connect(null, mapDispatchToProps)(FileDropTarget);

export {
  FileDropTarget as UnconnectedFileDropTarget,
};
