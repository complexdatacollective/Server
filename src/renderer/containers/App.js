import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import logger from 'electron-log';
import { bindActionCreators } from 'redux';
import { connect, useDispatch } from 'react-redux';
import { ipcRenderer, remote } from 'electron';
import { withRouter } from 'react-router-dom';
import { Button } from '@codaco/ui';
import DialogManager from '../components/DialogManager';
import AppRoutes from './AppRoutes';
import ProtocolNav from './ProtocolNav';
import AdminApiClient from '../utils/adminApiClient';
import SessionFileDropTarget from '../containers/SessionFileDropTarget';
import { actionCreators } from '../ducks/modules/pairingRequest';
import { actionCreators as connectionInfoActionCreators } from '../ducks/modules/connectionInfo';
import { actionCreators as deviceActionCreators } from '../ducks/modules/devices';
import { actionCreators as protocolActionCreators } from '../ducks/modules/protocols';
import { actionCreators as toastActions } from '../ducks/modules/toasts';
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
  const dispatch = useDispatch();

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
      // Remove any prior request toast
      toastActions.removeToast('pairing-request-toast');

      const handleDismissPair = () => {
        dispatch(toastActions.removeToast('pairing-request-toast'));
        dismissPairingRequest();
      };

      const handleAcknowledgePair = () => {
        dispatch(toastActions.removeToast('pairing-request-toast', false));
        ackPairingRequest();
      };

      dispatch(toastActions.addToast({
        id: 'pairing-request-toast',
        type: 'info',
        classNames: 'toast--wide',
        title: 'Pair Device?',
        autoDismiss: false,
        onDismiss: dismissPairingRequest,
        content: (
          <React.Fragment>
            <p>
              A device is attempting to pair with this computer.
              This will give it access to your interview protocols and allow it to upload data.
            </p>
            <div className="toast-button-group">
              <Button color="platinum--dark" onClick={handleDismissPair}>Dismiss</Button>
              <Button color="neon-coral" onClick={handleAcknowledgePair}>Pair With Device</Button>
            </div>
          </React.Fragment>
        ),
      }));
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

      history.push('/'); // Root -> Overview -> GetStarted
    });
  }, []);

  return (
    <div className={appClass}>
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
                        You have started Server with the <code>unsafe-pairing-code</code> option
                        set. This option severely undermines the security of Server,
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
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }),
  setConnectionInfo: PropTypes.func.isRequired,
};

App.defaultProps = {
  showConfirmationMessage: () => {},
  history: {
    push: () => {},
  },
};

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

const ConnectedApp = connect(null, mapDispatchToProps)(App);

export default withRouter(ConnectedApp);

export {
  App as UnconnectedApp,
  ConnectedApp,
};
