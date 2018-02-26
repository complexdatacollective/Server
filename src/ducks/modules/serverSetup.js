import { persistor } from '../store';

const initialState = {
  setupComplete: false,
};

const RESET_SETUP = 'RESET_SETUP';
const COMPLETE_SETUP = 'COMPLETE_SETUP';

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case COMPLETE_SETUP: {
      return {
        ...state,
        setupComplete: true,
      };
    }
    case RESET_SETUP:
      persistor.purge(['serverSetup']);
      return {
        ...state,
        setupComplete: false,
      };
    default:
      return state;
  }
}

function resetSetup() {
  return {
    type: RESET_SETUP,
  };
}

function completeSetup() {
  return {
    type: COMPLETE_SETUP,
  };
}

const actionCreators = {
  resetSetup,
  completeSetup,
};

const actionTypes = {
  RESET_SETUP,
  COMPLETE_SETUP,
};

export {
  actionCreators,
  actionTypes,
};
