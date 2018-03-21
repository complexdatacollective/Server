import { combineReducers } from 'redux';

import pairingReducer from './pairingRequest';

const appReducer = combineReducers({
  pairingRequest: pairingReducer,
});

const rootReducer = (state, action) => {
  let currentState = state;

  if (action.type === 'RESET_STATE') {
    currentState = undefined;
  }

  return appReducer(currentState, action);
};

export default rootReducer;
