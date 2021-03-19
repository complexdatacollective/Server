import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ipcRenderer } from 'electron';
import { withRouter } from 'react-router-dom';
import { appVersion } from '../utils/appVersion';
import Types from '../types';
import { actionCreators } from '../ducks/modules/protocols';
import FileDropTarget from './FileDropTarget';
import ProtocolThumbnails from '../components/ProtocolThumbnails';
import AdminApiClient from '../utils/adminApiClient';
import server from '../images/Srv-Flat.svg';

// TODO: centralize ipc or events
const RequestFileImportDialog = 'REQUEST_FILE_IMPORT_DIALOG';
const FileImportUpdated = 'FILE_IMPORT_UPDATED';

const versionParts = appVersion.split('-');

const ipcChannels = {
  FileImportUpdated,
  RequestFileImportDialog,
};

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
    const { className, location, protocols } = this.props;
    return (
      <>
        <nav className={className}>
          <FileDropTarget>
            <ProtocolThumbnails
              location={location}
              protocols={protocols}
              onClickAddProtocol={promptFileImport}
            />
          </FileDropTarget>
          <div className="app-version">
            <img src={server} alt="Network Canvas Server" />
            <span>
              {versionParts[0]}
              {' '}
              {versionParts[1]}
            </span>
          </div>
        </nav>
      </>
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
  location: PropTypes.object.isRequired,
  protocols: Types.protocols,
};

const mapStateToProps = (reduxState) => ({
  protocols: reduxState.protocols,
});

const mapDispatchToProps = (dispatch) => ({
  loadProtocols: bindActionCreators(actionCreators.loadProtocols, dispatch),
});

const ConnectedProtocolNav = connect(mapStateToProps, mapDispatchToProps)(ProtocolNav);

export default withRouter(ConnectedProtocolNav);

export {
  ConnectedProtocolNav,
  ProtocolNav as UnconnectedProtocolNav,
  ipcChannels,
};
