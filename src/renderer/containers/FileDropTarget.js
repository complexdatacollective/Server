/* eslint
no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["evt"] }] */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import AdminApiClient from '../utils/adminApiClient';
import { actionCreators as messageActionCreators, messages } from '../ducks/modules/appMessages';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';

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

    const fileList = evt.dataTransfer.files;
    const files = [];
    for (let i = 0; i < fileList.length; i += 1) {
      files.push(fileList[i].path);
    }

    const { loadProtocols, showConfirmationMessage, showErrorMessage } = this.props;
    this.setState({ draggingOver: false });
    this.apiClient
      .post('/protocols', { files })
      .then(resp => resp.protocols)
      .then(() => showConfirmationMessage(messages.protocolImportSuccess))
      .then(() => loadProtocols())
      .catch(err => showErrorMessage(err.message || 'Could not save file'));
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
};

FileDropTarget.propTypes = {
  children: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  loadProtocols: PropTypes.func,
  showConfirmationMessage: PropTypes.func.isRequired,
  showErrorMessage: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  showConfirmationMessage:
    bindActionCreators(messageActionCreators.showConfirmationMessage, dispatch),
  showErrorMessage: bindActionCreators(messageActionCreators.showErrorMessage, dispatch),
  loadProtocols: bindActionCreators(protocolActionCreators.loadProtocols, dispatch),
});

export default connect(null, mapDispatchToProps)(FileDropTarget);

export {
  FileDropTarget as UnconnectedFileDropTarget,
};
