/* eslint
no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["evt"] }] */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import AdminApiClient from '../utils/adminApiClient';
import { messages } from '../ducks/modules/appMessages';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';

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

  onDragEnter() {
    this.setState({ draggingOver: true });
  }

  onDragLeave(evt) {
    evt.stopPropagation();
    // Ignore event if dragging over a contained child (where evt.target is the child)
    if (this.containerRef.current === evt.target) {
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
      .post(this.props.postURI, { files })
      .then(resp => ({ filenames: resp.filenames, errorMessages: resp.message }))
      .then(({ errorMessages }) => {
        if (errorMessages) this.showErrorDialog(errorMessages);
      })
      .then(() => loadProtocols())
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

  render() {
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
      <div {...containerProps} ref={this.containerRef}>
        { this.props.children }
      </div>
    );
  }
}

FileDropTarget.defaultProps = {
  children: null,
  loadProtocols: () => {},
  postURI: '/protocols',
  confirmationMessage: messages.protocolImportSuccess,
};

FileDropTarget.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  postURI: PropTypes.string,
  confirmationMessage: PropTypes.string,
  loadProtocols: PropTypes.func,
  openDialog: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  loadProtocols: bindActionCreators(protocolActionCreators.loadProtocols, dispatch),
  openDialog: bindActionCreators(dialogActions.openDialog, dispatch),
});

export default connect(null, mapDispatchToProps)(FileDropTarget);

export {
  FileDropTarget as UnconnectedFileDropTarget,
};
