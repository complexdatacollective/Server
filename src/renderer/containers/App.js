import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ipcRenderer, remote } from 'electron';
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
import { isFrameless } from '../utils/environment';
import ipcChannels from '../utils/ipcChannels';
import ToastManager from '../components/ToastManager';
import useUpdater from '../hooks/useUpdater';

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

/**
 * Main app container.
 */
const App = ({
  ackPairingRequest,
  dismissAppMessage,
  dismissPairingRequest,
  appMessages,
  pairingRequest,
  setConnectionInfo,
  newPairingRequest,
  completedPairingRequest,
  loadDevices,
  resetApp,
  loadProtocols,
  dismissAppMessages,
  history,
}) => {
  const [apiReady, setApiReady] = useState(false);
  const insecure = remote.app.commandLine.hasSwitch('unsafe-pairing-code');

  const appClass = isFrameless() ? 'app app--frameless' : 'app';
  const versionParts = appVersion.split('-');

  const handleDismissal = timestamp => dismissAppMessage(timestamp);

  useUpdater('https://api.github.com/repos/complexdatacollective/Server/releases/latest', 2500);

  const updateAPIInfo = (connectionInfo) => {
    if (connectionInfo.adminService) {
      AdminApiClient.setPort(connectionInfo.adminService.port);
    } else {
      logger.warn('Admin API unavailable');
    }
    setConnectionInfo(connectionInfo);
    setApiReady(true);
  };

  useEffect(() => {
    preventGlobalDragDrop();

    // Initialise UI with back end API details
    ipcRenderer.send(ipcChannels.REQUEST_API_INFO);
    ipcRenderer.once(ipcChannels.API_INFO, (_, connectionInfo) => updateAPIInfo(connectionInfo));

    // Handle pairing
    ipcRenderer.on(ipcChannels.PAIRING_CODE_AVAILABLE, (_, data) => {
      newPairingRequest(data.id, data.pairingCode);
    });

    ipcRenderer.on(ipcChannels.PAIRING_TIMED_OUT, () => {
      dismissPairingRequest();
    });

    ipcRenderer.on(ipcChannels.PAIRING_COMPLETE, () => {
      completedPairingRequest();
      loadDevices();
    });

    // Respond to backend data reset
    ipcRenderer.on(ipcChannels.RESET_APP, () => {
      resetApp(); // Reset state to initial state
      ipcRenderer.send(ipcChannels.REQUEST_API_INFO); // Recover backend API info
      ipcRenderer.once(ipcChannels.API_INFO, (_, connectionInfo) => updateAPIInfo(connectionInfo));

      loadDevices(); // Request device data
      loadProtocols(); // Request protocol data

      history.push('/overview'); // Navigate to overview screen
    });

    dismissAppMessages();
  }, []);

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
};

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
};

App.defaultProps = {
  appMessages: [],
  pairingRequest: {},
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
  };
}

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);

export default withRouter(ConnectedApp);

export {
  App as UnconnectedApp,
  ConnectedApp,
};
