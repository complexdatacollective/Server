import { combineReducers } from 'redux';

import appMessages from './appMessages';
import connectionInfo from './connectionInfo';
import devices from './devices';
import excludedChartVariables from './excludedChartVariables';
import pairingRequest from './pairingRequest';
import dialogs from './dialogs';
import panelLayoutOrders from './panelLayoutOrders';
import protocols from './protocols';
import app from './app';

const appReducer = combineReducers({
  appMessages,
  dialogs,
  connectionInfo,
  devices,
  excludedChartVariables,
  pairingRequest,
  panelLayoutOrders,
  protocols,
  app,
});

const rootReducer = (state, action) => {
  if (action.type === 'RESET_APP') {
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export default rootReducer;
