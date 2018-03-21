import React, { Component } from 'react';

import AdminApiClient from '../utils/adminApiClient';

const onDragOver = evt => evt.preventDefault();

class FileDropTarget extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.onDrop = this.onDrop.bind(this);
  }

  onDrop(evt) {
    evt.preventDefault();
    evt.stopPropagation();

    const fileList = evt.dataTransfer.files;
    const files = [];
    for (let i = 0; i < fileList.length; i += 1) {
      files.push(fileList[i].path);
    }

    const adminApiClient = new AdminApiClient();
    adminApiClient
      .post('/protocols', { files })
      .then(resp => resp.data)
      .then(savedFilenames => this.setState({ savedFilenames }));
  }

  render() {
    const { savedFilenames } = this.state;
    return (
      <div className="file-drop-target" onDrop={this.onDrop} onDragOver={onDragOver}>
        <ul>
          {
            /* demo only */
            savedFilenames &&
            savedFilenames.map(f => <li key={f}>{f}</li>)
          }
        </ul>
        <p>
          {
            !savedFilenames &&
            'Drop protocol files here to import'
          }
        </p>
      </div>
    );
  }
}

export default FileDropTarget;
