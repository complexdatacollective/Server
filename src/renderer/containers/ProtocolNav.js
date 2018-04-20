import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';

import Types from '../types';
import { actionCreators } from '../ducks/modules/protocols';
import FileDropTarget from './FileDropTarget';
import ProtocolThumbnails from '../components/ProtocolThumbnails';
import AdminApiClient from '../utils/adminApiClient';

// TODO: centralize ipc or events
const RequestFileImportDialog = 'REQUEST_FILE_IMPORT_DIALOG';
const FileImportUpdated = 'FILE_IMPORT_UPDATED';

const promptFileImport = () => {
  ipcRenderer.send(RequestFileImportDialog);
};

class ProtocolNav extends Component {
  constructor(props) {
    super(props);
    this.apiClient = new AdminApiClient();
  }

  componentDidMount() {
    this.props.loadProtocols();
    ipcRenderer.on(FileImportUpdated, this.props.loadProtocols);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener(FileImportUpdated, this.props.loadProtocols);
  }

  render() {
    const { className, protocols } = this.props;
    return (
      <nav className={className}>
        <FileDropTarget>
          <ProtocolThumbnails
            protocols={protocols}
            onClickAddProtocol={promptFileImport}
          />
        </FileDropTarget>
      </nav>
    );
  }
}

ProtocolNav.defaultProps = {
  className: '',
  protocols: [],
};

ProtocolNav.propTypes = {
  className: PropTypes.string,
  loadProtocols: PropTypes.func.isRequired,
  protocols: Types.protocols,
};

const mapStateToProps = reduxState => ({
  protocols: reduxState.protocols,
});

const mapDispatchToProps = dispatch => ({
  loadProtocols: bindActionCreators(actionCreators.loadProtocols, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProtocolNav);

export {
  ProtocolNav as UnconnectedProtocolNav,
};