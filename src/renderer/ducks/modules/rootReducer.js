import { combineReducers } from 'redux';

import appMessages from './appMessages';
import connectionInfo from './connectionInfo';
import devices from './devices';
import pairingRequest from './pairingRequest';
import protocols from './protocols';

const appReducer = combineReducers({
  appMessages,
  connectionInfo,
  devices,
  pairingRequest,
  protocols,
});

const rootReducer = (state, action) => appReducer(state, action);

export default rootReducer;
