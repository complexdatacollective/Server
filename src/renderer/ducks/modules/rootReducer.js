import { combineReducers } from 'redux';

import appMessages from './appMessages';
import connectionInfo from './connectionInfo';
import devices from './devices';
import excludedChartVariables from './excludedChartVariables';
import pairingRequest from './pairingRequest';
import dialogs from './dialogs';
import toasts from './toasts';
import panelLayoutOrders from './panelLayoutOrders';
import protocols from './protocols';
import dismissibleState from './dismissibleState';

const appReducer = combineReducers({
  appMessages,
  dialogs,
  toasts,
  connectionInfo,
  devices,
  excludedChartVariables,
  pairingRequest,
  panelLayoutOrders,
  protocols,
  dismissibleState,
});

const rootReducer = (state, action) => {
  if (action.type === 'RESET_APP') {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export default rootReducer;
