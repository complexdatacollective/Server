const SET_CONNECTION_INFO = 'SET_CONNECTION_INFO';

const initialState = null;

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case SET_CONNECTION_INFO:
      return action.connectionInfo;
    default:
      return state;
  }
};

const setConnectionInfo = (connectionInfo) => ({
  type: SET_CONNECTION_INFO,
  connectionInfo,
});

const actionCreators = {
  setConnectionInfo,
};

const actionTypes = {
  SET_CONNECTION_INFO,
};

export default reducer;

export {
  actionCreators,
  actionTypes,
  initialState,
};
