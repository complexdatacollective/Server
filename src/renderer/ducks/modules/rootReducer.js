import { combineReducers } from 'redux';

import appMessages from './appMessages';
import connectionInfo from './connectionInfo';
import devices from './devices';
import excludedChartVariables from './excludedChartVariables';
import pairingRequest from './pairingRequest';
import dialogs from './dialogs';
import panelLayoutOrders from './panelLayoutOrders';
import protocols from './protocols';

const appReducer = combineReducers({
  appMessages,
  dialogs,
  connectionInfo,
  devices,
  excludedChartVariables,
  pairingRequest,
  panelLayoutOrders,
  protocols,
  ui,
});

const rootReducer = (state, action) => appReducer(state, action);

export default rootReducer;
