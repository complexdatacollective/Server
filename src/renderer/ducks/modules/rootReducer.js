import { combineReducers } from 'redux';

import appMessages from './appMessages';
import devices from './devices';
import pairingRequest from './pairingRequest';
import protocols from './protocols';

const appReducer = combineReducers({
  appMessages,
  devices,
  pairingRequest,
  protocols,
});

const rootReducer = (state, action) => appReducer(state, action);

export default rootReducer;
