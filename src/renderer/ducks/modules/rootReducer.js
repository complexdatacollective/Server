import { combineReducers } from 'redux';

import appMessages from './appMessages';
import connectionInfo from './connectionInfo';
import devices from './devices';
import excludedChartVariables from './excludedChartVariables';
import pairingRequest from './pairingRequest';
import panelLayoutOrders from './panelLayoutOrders';
import protocols from './protocols';

const appReducer = combineReducers({
  appMessages,
  connectionInfo,
  devices,
  excludedChartVariables,
  pairingRequest,
  panelLayoutOrders,
  protocols,
});

const rootReducer = (state, action) => appReducer(state, action);

export default rootReducer;
