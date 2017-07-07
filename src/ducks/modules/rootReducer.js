import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form';

// import example from './example';

const appReducer = combineReducers({
  form: formReducer,
  // example,
});

const rootReducer = (state, action) => {
  let currentState = state;

  if (action.type === 'RESET_STATE') {
    currentState = undefined;
  }

  return appReducer(currentState, action);
};

export default rootReducer;
