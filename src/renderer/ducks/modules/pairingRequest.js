const ACKNOWLEDGE_PAIRING_REQUEST = 'ACKNOWLEDGE_PAIRING_REQUEST';
const COMPLETED_PAIRING_REQUEST = 'COMPLETED_PAIRING_REQUEST';
const DISMISS_PAIRING_REQUEST = 'DISMISS_PAIRING_REQUEST';
const NEW_PAIRING_REQUEST = 'NEW_PAIRING_REQUEST';

const initialState = {};

// The pairing process is a simple state machine;
// actions can be initiated by an admin (GUI) user or a client device.
//
// States:
const PairingStatus = {
  // A device has requested pairing, but the admin has not yet confirmed
  Pending: 'pending',
  // The admin has confirmed the request to pair, and should be given a pairing code
  Acknowledged: 'acknowledged',
  // The device has successfully entered the pairing code and completed pairing
  Complete: 'complete',
};

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case ACKNOWLEDGE_PAIRING_REQUEST:
      return { ...state, status: PairingStatus.Acknowledged };
    case DISMISS_PAIRING_REQUEST:
      return initialState;
    case COMPLETED_PAIRING_REQUEST:
      // Any completion notice clears out the previous pairingCode
      return {
        status: PairingStatus.Complete,
      };
    case NEW_PAIRING_REQUEST:
      return {
        ...state,
        status: PairingStatus.Pending,
        pairingCode: action.pairingCode,
      };
    default:
      return state;
  }
};

const requestIsPending = state => (state.pairingRequest.status === PairingStatus.Pending);

const acknowledgePairingRequest = () => (
  {
    type: ACKNOWLEDGE_PAIRING_REQUEST,
  }
);

const completedPairingRequest = () => (
  {
    type: COMPLETED_PAIRING_REQUEST,
  }
);

const dismissPairingRequest = () => (
  {
    type: DISMISS_PAIRING_REQUEST,
  }
);

const newPairingRequest = pairingCode => (
  {
    type: NEW_PAIRING_REQUEST,
    pairingCode,
  }
);

const actionCreators = {
  acknowledgePairingRequest,
  completedPairingRequest,
  dismissPairingRequest,
  newPairingRequest,
};

const actionTypes = {
  ACKNOWLEDGE_PAIRING_REQUEST,
  COMPLETED_PAIRING_REQUEST,
  DISMISS_PAIRING_REQUEST,
  NEW_PAIRING_REQUEST,
};

const selectors = {
  requestIsPending,
};

export default reducer;

export {
  actionCreators,
  actionTypes,
  PairingStatus,
  selectors,
};
