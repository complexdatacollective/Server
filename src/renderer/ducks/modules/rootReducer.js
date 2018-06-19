import { combineReducers } from 'redux';

import appMessages from './appMessages';
import devices from './devices';
import pairingRequest from './pairingRequest';
import currentProtocolId from './currentProtocolId';
import protocols from './protocols';

const appReducer = combineReducers({
  appMessages,
  currentProtocolId,
  devices,
  pairingRequest,
  protocols,
});

const rootReducer = (state, action) => appReducer(state, action);

export default rootReducer;
