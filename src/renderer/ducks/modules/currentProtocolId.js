const SET_CURRENT_PROTOCOL = 'SET_CURRENT_PROTOCOL';

const initialState = null;

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case SET_CURRENT_PROTOCOL:
      return action.id;
    default:
      return state;
  }
};

const setCurrentProtocol = id => ({
  type: SET_CURRENT_PROTOCOL,
  id,
});

const actionCreators = {
  setCurrentProtocol,
};

const actionTypes = {
  SET_CURRENT_PROTOCOL,
};

export {
  actionCreators,
  actionTypes,
};

export default reducer;
