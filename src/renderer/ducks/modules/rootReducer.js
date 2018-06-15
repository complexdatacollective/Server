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

const rootReducer = (state, action) => {
  let currentState = state;

  if (action.type === 'RESET_STATE') {
    currentState = undefined;
  }

  return appReducer(currentState, action);
};

export default rootReducer;
