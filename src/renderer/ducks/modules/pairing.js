const NEW_PAIRING_REQUEST = 'NEW_PAIRING_REQUEST';

const initialState = {};

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case NEW_PAIRING_REQUEST:
      return {
        ...state,
        pairingCode: action.pairingCode,
      };
    default:
      return state;
  }
};

const newPairingRequest = pairingCode => (
  {
    type: NEW_PAIRING_REQUEST,
    pairingCode,
  }
);

const actionCreators = {
  newPairingRequest,
};

const actionTypes = {
  NEW_PAIRING_REQUEST,
};

export default reducer;

export {
  actionCreators,
  actionTypes,
};
