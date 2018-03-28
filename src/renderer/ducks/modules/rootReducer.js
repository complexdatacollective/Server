import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';

import pairingReducer from './pairingRequest';

const appReducer = combineReducers({
  form: formReducer,
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
