import React, { Component } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ipcRenderer, shell, remote } from 'electron';
import { withRouter } from 'react-router-dom';
import { Button } from '../ui/components';
import DialogManager from '../components/DialogManager';
import AppRoutes from './AppRoutes';
import ProtocolNav from './ProtocolNav';
import AdminApiClient from '../utils/adminApiClient';
import { appVersion, codename } from '../utils/appVersion';
import NCLogo from '../images/NC-Mark.svg';
import { AppMessage } from '../components';
import { openExternalLink } from '../components/ExternalLink';
import { AnimatedPairPrompt } from '../components/pairing/PairPrompt';
import { actionCreators, PairingStatus } from '../ducks/modules/pairingRequest';
import { actionCreators as connectionInfoActionCreators } from '../ducks/modules/connectionInfo';
import { actionCreators as deviceActionCreators } from '../ducks/modules/devices';
import { actionCreators as dialogActions } from '../ducks/modules/dialogs';
import { actionCreators as messageActionCreators, messages } from '../ducks/modules/appMessages';
import { isFrameless } from '../utils/environment';


const IPC = {
  REQUEST_API_INFO: 'REQUEST_API_INFO',
  API_INFO: 'API_INFO',
  PAIRING_CODE_AVAILABLE: 'PAIRING_CODE_AVAILABLE',
  PAIRING_TIMED_OUT: 'PAIRING_TIMED_OUT',
  PAIRING_COMPLETE: 'PAIRING_COMPLETE',
  PROTOCOL_IMPORT_SUCCEEDED: 'PROTOCOL_IMPORT_SUCCEEDED',
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

    this.state = {
      apiReady: false,
      insecure: remote.app.commandLine.hasSwitch('unsafe-pairing-code'),
    };

    preventGlobalDragDrop();
    enableExternalLinks();

    ipcRenderer.send(IPC.REQUEST_API_INFO);
    ipcRenderer.once(IPC.API_INFO, (event, connectionInfo) => {
      if (connectionInfo.adminService) {
        AdminApiClient.setPort(connectionInfo.adminService.port);
      } else {
        logger.warn('Admin API unavailable');
      }
      this.props.setConnectionInfo(connectionInfo);
      this.setState({ apiReady: true });
    });

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

    ipcRenderer.on(IPC.PROTOCOL_IMPORT_SUCCEEDED, () => {
      props.showConfirmationMessage(messages.protocolImportSuccess);
    });

    this.props.dismissAppMessages();

    this.props.openDialog({
      type: 'Notice',
      title: 'Please upgrade to continue receiving support',
      canCancel: false,
      message: (
        <React.Fragment>
          <p>
            Our initial development period has come to an end, and we are pleased to announce
            the release of the first stable versions of Network Canvas, Architect,
            and Server. Since stable versions are now available, the version of the software
            that you are currently using is no longer supported. Please visit our
            documentation website for information about how to update to the new versions.
          </p>
          <p>
            <Button
              color="sea-serpent"
              onClick={() => openExternalLink('https://documentation.networkcanvas.com/docs/technical-documentation/updating-from-beta/')}
            >
              Visit documentation website
            </Button>
          </p>
          <p>
            In the meantime, you can continue to use this version of the software
            in order to export data, or conclude any in-progress work. The stable releases include
            many new fixes and features collected from feedback you have provided, and we strongly
            encourage you to update to them as soon as possible.
          </p>
        </React.Fragment>
      ),
    });
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
  newPairingRequest: PropTypes.func.isRequired,
  pairingRequest: PropTypes.shape({
    status: PropTypes.string,
  }),
  setConnectionInfo: PropTypes.func.isRequired,
  showConfirmationMessage: PropTypes.func,
  dismissAppMessages: PropTypes.func.isRequired,
  openDialog: PropTypes.func.isRequired,
};

App.defaultProps = {
  appMessages: [],
  pairingRequest: {},
  showConfirmationMessage: () => {},
  openDialog: () => {},
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
    openDialog: bindActionCreators(dialogActions.openDialog, dispatch),
    newPairingRequest: bindActionCreators(actionCreators.newPairingRequest, dispatch),
    showConfirmationMessage:
      bindActionCreators(messageActionCreators.showConfirmationMessage, dispatch),
    dismissPairingRequest: bindActionCreators(actionCreators.dismissPairingRequest, dispatch),
    dismissAppMessage: bindActionCreators(messageActionCreators.dismissAppMessage, dispatch),
    dismissAppMessages: bindActionCreators(messageActionCreators.dismissAppMessages, dispatch),
    setConnectionInfo: bindActionCreators(connectionInfoActionCreators.setConnectionInfo, dispatch),
  };
}

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);

export default withRouter(ConnectedApp);

export {
  App as UnconnectedApp,
  ConnectedApp,
  IPC,
};
