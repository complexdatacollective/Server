import { ipcRenderer } from 'electron';
import { actionTypes } from '../modules/pairingRequest';

/**
 * pairingObserver middleware
 * If a pairing acknowledgement or dismissal is seen, send a corresponding message
 * to the main process, so that it can take action as needed (for example, responding
 * to an outstanding, long-lived pairing request.)
 */
const pairingObserver = () => (next) => (action) => {
  if (action.type === actionTypes.ACKNOWLEDGE_PAIRING_REQUEST) {
    ipcRenderer.send('PairingCodeAcknowledged');
  } else if (action.type === actionTypes.DISMISS_PAIRING_REQUEST) {
    ipcRenderer.send('PairingCodeDismissed');
  }
  next(action);
};

export default pairingObserver;
