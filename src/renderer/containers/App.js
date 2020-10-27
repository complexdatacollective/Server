import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ipcRenderer, shell, remote } from 'electron';
import { withRouter } from 'react-router-dom';
import DialogManager from '../components/DialogManager';
import AppRoutes from './AppRoutes';
import ProtocolNav from './ProtocolNav';
import AdminApiClient from '../utils/adminApiClient';
import { appVersion, codename } from '../utils/appVersion';
import NCLogo from '../images/NC-Mark.svg';
import { AppMessage } from '../components';
import SessionFileDropTarget from '../containers/SessionFileDropTarget';
import { AnimatedPairPrompt } from '../components/pairing/PairPrompt';
import { actionCreators, PairingStatus } from '../ducks/modules/pairingRequest';
import { actionCreators as connectionInfoActionCreators } from '../ducks/modules/connectionInfo';
import { actionCreators as deviceActionCreators } from '../ducks/modules/devices';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';
import { actionCreators as messageActionCreators } from '../ducks/modules/appMessages';
import { actionCreators as toastActions } from '../ducks/modules/toasts';
import { isFrameless } from '../utils/environment';
import ToastManager from '../components/ToastManager';

const IPC = {
  REQUEST_API_INFO: 'REQUEST_API_INFO',
  API_INFO: 'API_INFO',
  PAIRING_CODE_AVAILABLE: 'PAIRING_CODE_AVAILABLE',
  PAIRING_TIMED_OUT: 'PAIRING_TIMED_OUT',
  PAIRING_COMPLETE: 'PAIRING_COMPLETE',
  RESET_APP: 'RESET_APP',
};

// This prevents user from being able to drop a file anywhere on the app
// (which by default triggers a 'save' dialog). If we want to support this,
// we'll need to take action & handle errors based on file types.
const preventGlobalDragDrop = () => {
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
};

const enableExternalLinks = () => {
  // Open all links in external browser
  document.addEventListener('click', (event) => {
    if (event.target && event.target.tagName === 'A' && event.target.classList.contains('external-link')) {
      event.preventDefault();
      shell.openExternal(event.target.href);
    }
  });
};

/**
 * Main app container.
 */
class App extends Component {
  constructor(props) {
    super(props);

    this.protocolImportToastID = 'protocolImportToast';
    this.protocolImportCancelled = false;

    this.state = {
      apiReady: false,
      insecure: remote.app.commandLine.hasSwitch('unsafe-pairing-code'),
    };

    preventGlobalDragDrop();
    enableExternalLinks();

    const updateAPIInfo = (connectionInfo) => {
      if (connectionInfo.adminService) {
        AdminApiClient.setPort(connectionInfo.adminService.port);
      } else {
        logger.warn('Admin API unavailable');
      }
      this.props.setConnectionInfo(connectionInfo);
      this.setState({ apiReady: true });
    };

    // Initialise UI with back end API details
    ipcRenderer.send(IPC.REQUEST_API_INFO);
    ipcRenderer.once(IPC.API_INFO, (event, connectionInfo) => updateAPIInfo(connectionInfo));

    // Handle pairing
    ipcRenderer.on(IPC.PAIRING_CODE_AVAILABLE, (event, data) => {
      props.newPairingRequest(data.id, data.pairingCode);
    });

    ipcRenderer.on(IPC.PAIRING_TIMED_OUT, () => {
      props.dismissPairingRequest();
    });

    ipcRenderer.on(IPC.PAIRING_COMPLETE, () => {
      props.completedPairingRequest();
      props.loadDevices();
    });

    // Respond to backend data reset
    ipcRenderer.on(IPC.RESET_APP, () => {
      props.resetApp(); // Reset state to initial state
      ipcRenderer.send(IPC.REQUEST_API_INFO); // Recover backend API info
      ipcRenderer.once(IPC.API_INFO, (event, connectionInfo) => updateAPIInfo(connectionInfo));

      props.loadDevices(); // Request device data
      props.loadProtocols(); // Request protocol data

      this.props.history.push('/overview'); // Navigate to overview screen
    });

    this.props.dismissAppMessages();
  }

  render() {
    const {
      ackPairingRequest,
      dismissAppMessage,
      dismissPairingRequest,
      appMessages,
      pairingRequest,
    } = this.props;

    const {
      apiReady,
      insecure,
    } = this.state;

    const appClass = isFrameless() ? 'app app--frameless' : 'app';
    const versionParts = appVersion.split('-');

    const handleDismissal = timestamp => dismissAppMessage(timestamp);

    return (
      <div className={appClass}>
        <div className="app__flash">
          { appMessages.map(msg => (
            <AppMessage key={msg.timestamp} {...msg} handleDismissal={handleDismissal} />
          )) }
        </div>
        {
          <AnimatedPairPrompt
            show={pairingRequest.status === PairingStatus.Pending}
            onAcknowledge={ackPairingRequest}
            onDismiss={dismissPairingRequest}
          />
        }
        <div className="app__titlebar" />
        <div className="app__content">
          {
            apiReady && (
              <React.Fragment>
                <ProtocolNav className="app__sidebar" />
                <SessionFileDropTarget>
                  <div className="app__screen">
                    { insecure &&
                      <div className="unsafe-pairing-warning">
                        <h3>Warning: Unsafe Pairing Enabled!</h3>
                        <p>
                          You have started Server with the <code>unsafe-pairing-code</code>
                          option set. This option severely undermines the security of Server,
                          and should <strong>not be used when conducting a study under any
                            circumstances</strong>.
                        </p>
                      </div>
                    }
                    <AppRoutes />
                  </div>
                </SessionFileDropTarget>
              </React.Fragment>
            )
          }
        </div>
        <div className="app__version">
          <img src={NCLogo} alt="" />
          <div>{versionParts[0]} {versionParts[1]}</div>
          {
            codename &&
            <div className="app__codename">{codename}</div>
          }
        </div>
        <DialogManager />
        <ToastManager />
      </div>
    );
  }
}

App.propTypes = {
  ackPairingRequest: PropTypes.func.isRequired,
  appMessages: PropTypes.array,
  completedPairingRequest: PropTypes.func.isRequired,
  dismissAppMessage: PropTypes.func.isRequired,
  dismissPairingRequest: PropTypes.func.isRequired,
  loadDevices: PropTypes.func.isRequired,
  loadProtocols: PropTypes.func.isRequired,
  resetApp: PropTypes.func.isRequired,
  newPairingRequest: PropTypes.func.isRequired,
  pairingRequest: PropTypes.shape({
    status: PropTypes.string,
  }),
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }),
  setConnectionInfo: PropTypes.func.isRequired,
  showConfirmationMessage: PropTypes.func,
  dismissAppMessages: PropTypes.func.isRequired,
  addToast: PropTypes.func,
};

App.defaultProps = {
  appMessages: [],
  pairingRequest: {},
  addToast: () => {},
  showConfirmationMessage: () => {},
  history: {
    push: () => {},
  },
};

const mapStateToProps = ({ pairingRequest, appMessages }) => ({
  pairingRequest,
  appMessages,
});

function mapDispatchToProps(dispatch) {
  return {
    ackPairingRequest: bindActionCreators(actionCreators.acknowledgePairingRequest, dispatch),
    completedPairingRequest: bindActionCreators(actionCreators.completedPairingRequest, dispatch),
    loadDevices: bindActionCreators(deviceActionCreators.loadDevices, dispatch),
    loadProtocols: bindActionCreators(protocolActionCreators.loadProtocols, dispatch),
    resetApp: () => dispatch({ type: 'RESET_APP' }),
    newPairingRequest: bindActionCreators(actionCreators.newPairingRequest, dispatch),
    showConfirmationMessage:
      bindActionCreators(messageActionCreators.showConfirmationMessage, dispatch),
    dismissPairingRequest: bindActionCreators(actionCreators.dismissPairingRequest, dispatch),
    dismissAppMessage: bindActionCreators(messageActionCreators.dismissAppMessage, dispatch),
    dismissAppMessages: bindActionCreators(messageActionCreators.dismissAppMessages, dispatch),
    setConnectionInfo: bindActionCreators(connectionInfoActionCreators.setConnectionInfo, dispatch),
    addToast: bindActionCreators(toastActions.addToast, dispatch),
    updateToast: bindActionCreators(toastActions.updateToast, dispatch),
    removeToast: bindActionCreators(toastActions.removeToast, dispatch),
  };
}

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);

export default withRouter(ConnectedApp);

export {
  App as UnconnectedApp,
  ConnectedApp,
  IPC,
};
