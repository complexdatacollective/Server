import React from 'react';

import Types from '../types';

const { ipcRenderer } = require('electron');
// TODO: centralize ipc or events
const RequestFileImportDialog = 'REQUEST_FILE_IMPORT_DIALOG';

const nickname = (name = '') => name.substr(0, 2);

const promptFileImport = () => {
  ipcRenderer.send(RequestFileImportDialog);
};

const ProtocolThumbnails = ({ protocols }) => (
  <div className="protocol-thumbnails">
    {
      protocols.map(protocol => (
        <div key={protocol.id} className="protocol-thumbnails__thumbnail" title={protocol.filename}>
          {nickname(protocol.name)}
        </div>
      ))
    }
    <button
      className="protocol-thumbnails__thumbnail protocol-thumbnails__thumbnail--add"
      onClick={promptFileImport}
    />
  </div>
);

ProtocolThumbnails.defaultProps = {
  protocols: [],
};

ProtocolThumbnails.propTypes = {
  protocols: Types.protocols,
};

export default ProtocolThumbnails;
