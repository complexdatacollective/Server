const UPDATE_SETTINGS = 'APP/UPDATE_SETTINGS';

const initialState = {};

const updateSettings = (settings, merge = true) => ({
  type: UPDATE_SETTINGS,
  payload: {
    settings,
    merge,
  },
});

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case UPDATE_SETTINGS:
      if (action.payload.merge === false) {
        return Object.assign({}, action.payload.settings);
      }

      return Object.assign({}, state, action.payload.settings);
    default:
      return state;
  }
};

export const actionTypes = {
  UPDATE_SETTINGS,
};

export const actionCreators = {
  updateSettings,
};

export default reducer;
