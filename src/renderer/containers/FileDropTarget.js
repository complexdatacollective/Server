/* eslint
no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["evt"] }] */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { Icon, Spinner, ProgressBar } from '@codaco/ui';
import AdminApiClient from '../utils/adminApiClient';
import { actionCreators as toastActions } from '../ducks/modules/toasts';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import ipcChannels from '../utils/ipcChannels';

const onDragOver = (evt) => {
  evt.preventDefault();
  evt.dataTransfer.dropEffect = 'copy';
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
    ipcRenderer.on(ipcChannels.PROTOCOL_IMPORT_START, this.showStartProtocolImportToast);
    ipcRenderer.on(ipcChannels.PROTOCOL_IMPORT_FAILURE, this.showProtocolImportFailureToast);
    ipcRenderer.on(ipcChannels.PROTOCOL_IMPORT_SUCCESS, this.showCompleteProtocolImportToast);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(
      ipcChannels.PROTOCOL_IMPORT_START, this.showStartProtocolImportToast,
    );
    ipcRenderer.removeListener(
      ipcChannels.PROTOCOL_IMPORT_FAILURE, this.showProtocolImportFailureToast,
    );
    ipcRenderer.removeListener(
      ipcChannels.PROTOCOL_IMPORT_SUCCESS, this.showCompleteProtocolImportToast,
    );
  }

  onDragEnter() {
    this.setState({ draggingOver: true });
  }

  onDragLeave(evt) {
    const { isOverlay } = this.props;
    evt.stopPropagation();
    // Ignore event if dragging over a contained child (where evt.target is the child)
    if (this.containerRef.current === evt.target || (isOverlay && evt.target.className === 'file-drop-target__overlay')) {
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
      .catch((err) => this.showErrorDialog(err.message || 'Could not save file'));
  }

  showErrorDialog = (error) => {
    const { openDialog } = this.props;

    openDialog({
      type: 'Warning',
      canCancel: false,
      title: 'Import Error',
      message: error,
    });
  }

  showStartProtocolImportToast = (_, fileBasename) => {
    const { addToast } = this.props;

    addToast({
      id: fileBasename,
      type: 'info',
      title: 'Importing...',
      CustomIcon: (<Spinner small />),
      autoDismiss: false,
      content: (
        <>
          <p>
            Importing
            {' '}
            {fileBasename}
            ...
          </p>
          <ProgressBar orientation="horizontal" percentProgress={30} />
        </>
      ),
    });
  };

  showProtocolImportFailureToast = (_, fileBasename, err) => {
    const { updateToast } = this.props;

    updateToast(fileBasename, {
      type: 'warning',
      title: 'Import failed',
      CustomIcon: (<Icon name="error" />),
      autoDismiss: false,
      content: (
        <>
          <p>
            Importing
            {' '}
            {fileBasename}
            {' '}
            failed!
          </p>
          <strong>Error details:</strong>
          <p>{(err && err.message) || err}</p>
        </>
      ),
    });
  };

  showCompleteProtocolImportToast = (_, fileBasename, protocolName) => {
    const {
      removeToast,
      addToast,
    } = this.props;

    removeToast(fileBasename);

    addToast({
      type: 'success',
      title: 'Import protocol complete!',
      content: (
        <>
          <p>
            The protocol &quot;
            {protocolName}
            &quot; was imported successfully.
          </p>
        </>
      ),
    });
  };

  render() {
    const { children } = this.props;
    const { draggingOver } = this.state;
    const containerProps = {
      className: 'file-drop-target',
      onDragEnter: this.onDragEnter,
      onDragLeave: this.onDragLeave,
      onDragOver,
      onDrop: this.onDrop,
    };
    if (draggingOver) {
      containerProps.className += ' file-drop-target--active';
    }

    return (
      // eslint-disable-next-line react/jsx-props-no-spreading
      <div {...containerProps} ref={this.containerRef}>
        { children }
      </div>
    );
  }
}

FileDropTarget.defaultProps = {
  children: null,
  isOverlay: false,
  loadProtocols: () => {},
  openDialog: () => {},
  addToast: () => {},
  removeToast: () => {},
  updateToast: () => {},
};

FileDropTarget.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  isOverlay: PropTypes.bool,
  loadProtocols: PropTypes.func,
  openDialog: PropTypes.func,
  addToast: PropTypes.func,
  removeToast: PropTypes.func,
  updateToast: PropTypes.func,
};

const mapDispatchToProps = (dispatch) => ({
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
