import { combineReducers } from 'redux';

import pairingRequest from './pairingRequest';
import appMessages from './appMessages';
import protocols from './protocols';

const appReducer = combineReducers({
  appMessages,
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
