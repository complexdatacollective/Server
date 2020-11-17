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
import { ServerPanel } from '../components';
import SessionFileDropTarget from '../containers/SessionFileDropTarget';
import { AnimatedPairPrompt } from '../components/pairing/PairPrompt';
import { actionCreators, PairingStatus } from '../ducks/modules/pairingRequest';
import { actionCreators as connectionInfoActionCreators } from '../ducks/modules/connectionInfo';
import { actionCreators as deviceActionCreators } from '../ducks/modules/devices';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';
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
  dismissPairingRequest,
  pairingRequest,
  setConnectionInfo,
  newPairingRequest,
  completedPairingRequest,
  loadDevices,
  resetApp,
  loadProtocols,
  history,
}) => {
  const [apiReady, setApiReady] = useState(false);
  const insecure = remote.app.commandLine.hasSwitch('unsafe-pairing-code');

  const appClass = isFrameless() ? 'app app--frameless' : 'app';

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

      history.push('/'); // Navigate to overview screen
    });
  }, []);

  return (
    <div className={appClass}>
      {
        <AnimatedPairPrompt
          show={pairingRequest.status === PairingStatus.Pending}
          onAcknowledge={ackPairingRequest}
          onDismiss={dismissPairingRequest}
        />
      }
      <div className="app__titlebar" />
      {apiReady && <ServerPanel />}
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
      <DialogManager />
      <ToastManager />
    </div>
  );
};

App.propTypes = {
  ackPairingRequest: PropTypes.func.isRequired,
  completedPairingRequest: PropTypes.func.isRequired,
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
};

App.defaultProps = {
  pairingRequest: {},
  showConfirmationMessage: () => {},
  history: {
    push: () => {},
  },
};

const mapStateToProps = ({ pairingRequest }) => ({
  pairingRequest,
});

function mapDispatchToProps(dispatch) {
  return {
    ackPairingRequest: bindActionCreators(actionCreators.acknowledgePairingRequest, dispatch),
    completedPairingRequest: bindActionCreators(actionCreators.completedPairingRequest, dispatch),
    loadDevices: bindActionCreators(deviceActionCreators.loadDevices, dispatch),
    loadProtocols: bindActionCreators(protocolActionCreators.loadProtocols, dispatch),
    resetApp: () => dispatch({ type: 'RESET_APP' }),
    newPairingRequest: bindActionCreators(actionCreators.newPairingRequest, dispatch),
    dismissPairingRequest: bindActionCreators(actionCreators.dismissPairingRequest, dispatch),
    setConnectionInfo: bindActionCreators(connectionInfoActionCreators.setConnectionInfo, dispatch),
  };
}

const ConnectedApp = connect(mapStateToProps, mapDispatchToProps)(App);

export default withRouter(ConnectedApp);

export {
  App as UnconnectedApp,
  ConnectedApp,
};
