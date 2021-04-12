import { get } from 'lodash';

const DISMISS_ITEM = 'DISMISSIBLE_STATE/DISMISS_ITEM';
const RESET = 'DISMISSIBLE_STATE/RESET';

const initialState = {};

const dismissItem = (item, name) => ({
  type: DISMISS_ITEM,
  payload: {
    item,
    name,
  },
});

export default (state = initialState, { type, payload } = { type: null, payload: null }) => {
  switch (type) {
    case DISMISS_ITEM:
      return {
        ...state,
        [payload.name]: [
          ...get(state, payload.name, []),
          payload.item,
        ],
      };
    case RESET:
      return initialState;
    default:
      return state;
  }
};

const getDismissedState = (name) => (state) => get(state.dismissibleState, name, []);

export const selectors = {
  getDismissedState,
};

export const actionTypes = {
  DISMISS_ITEM,
  RESET,
};

export const actionCreators = {
  dismissItem,
};
