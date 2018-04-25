/* eslint
no-param-reassign: ["error", { "props": true, "ignorePropertyModificationsFor": ["evt"] }] */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import AdminApiClient from '../utils/adminApiClient';
import { actionCreators } from '../ducks/modules/appMessages';

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
    this.getSavedFiles = this.getSavedFiles.bind(this);
  }

  componentDidMount() {
    this.getSavedFiles();
  }

  onDragEnter() {
    this.setState({ draggingOver: true });
  }

  onDragLeave() {
    this.setState({ draggingOver: false });
  }

  onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const fileList = evt.dataTransfer.files;
    const files = [];
    for (let i = 0; i < fileList.length; i += 1) {
      files.push(fileList[i].path);
    }

    this.setState({ draggingOver: false });
    this.apiClient
      .post('/protocols', { files })
      .then(resp => resp.protocols)
      .then(this.getSavedFiles)
      .catch(err => this.props.showMessage(err.message || 'Could not save file'));
  }

  getSavedFiles() {
    this.apiClient.get('/protocols')
      .then(resp => resp.protocols)
      .then(protocols => this.setState({ protocols }));
  }

  render() {
    const { draggingOver, protocols = [] } = this.state;
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
      <div {...containerProps}>
        <ul>
          {
            protocols.length > 0 &&
            protocols.map(f => <li key={f.filename}>{f.filename}</li>)
          }
        </ul>
        <p>
          {
            !protocols.length &&
            'Drop protocol files here to import'
          }
        </p>
      </div>
    );
  }
}

FileDropTarget.propTypes = {
  showMessage: PropTypes.func.isRequired,
};

const mapDispatchToProps = dispatch => ({
  showMessage: bindActionCreators(actionCreators.showMessage, dispatch),
});

export default connect(null, mapDispatchToProps)(FileDropTarget);

export {
  FileDropTarget as UnconnectedFileDropTarget,
};
