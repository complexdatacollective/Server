import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';

import pairingReducer from './pairing';

const appReducer = combineReducers({
  form: formReducer,
  pairing: pairingReducer,
});

const rootReducer = (state, action) => {
  let currentState = state;

  if (action.type === 'RESET_STATE') {
    currentState = undefined;
  }

  return appReducer(currentState, action);
};

export default rootReducer;
