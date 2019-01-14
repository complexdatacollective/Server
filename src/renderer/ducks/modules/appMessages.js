const DISMISS_MESSAGE = 'DISMISS_MESSAGE';
const DISMISS_MESSAGES = 'DISMISS_MESSAGES';
const SHOW_MESSAGE = 'SHOW_MESSAGE';
const UPDATE_MESSAGE_STATE = 'UPDATE_MESSAGE_STATE';

const messageLifetimeMillis = 10 * 1000;
const initialState = [];

const messageTypes = {
  Confirmation: Symbol('Confirmation'),
  Error: Symbol('Error'),
};

const messages = {
  protocolImportSuccess: 'Protocol imported successfully',
};

const newMessage = (text, messageType) => ({
  messageType,
  timestamp: Date.now(),
  text,
});

const isRecent = m => m.timestamp >= Date.now() - messageLifetimeMillis;

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case DISMISS_MESSAGES:
      return initialState;
    case DISMISS_MESSAGE:
      return state.filter(msg => msg.timestamp !== action.messageTimestamp);
    case UPDATE_MESSAGE_STATE:
      return state
        .filter(msg => !msg.isExpired)
        .map(msg => (isRecent(msg) ? msg : { ...msg, isExpired: true }));
    case SHOW_MESSAGE: {
      const message = {
        text: action.text,
        timestamp: action.timestamp,
        type: action.messageType,
      };
      return state
        .filter(isRecent)
        .filter(m => m.timestamp !== action.timestamp)
        .concat([message]);
    }
    default:
      return state;
  }
};

// Used internally to mark old messages as expired
const updateMessageState = () => ({
  type: UPDATE_MESSAGE_STATE,
});

const dismissAppMessages = () => ({
  type: DISMISS_MESSAGES,
});

const dismissAppMessage = messageTimestamp => ({
  type: DISMISS_MESSAGE,
  messageTimestamp,
});

const showMessage = (text, messageType = messageTypes.Error) => (dispatch) => {
  dispatch({
    type: SHOW_MESSAGE,
    ...newMessage(text, messageType),
  });
  setTimeout(() => dispatch(updateMessageState()), messageLifetimeMillis);
};

const showConfirmationMessage = text => showMessage(text, messageTypes.Confirmation);

const showErrorMessage = showMessage;

const actionCreators = {
  dismissAppMessage,
  dismissAppMessages,
  showConfirmationMessage,
  showErrorMessage,
};

const actionTypes = {
  DISMISS_MESSAGES,
  DISMISS_MESSAGE,
  SHOW_MESSAGE,
  UPDATE_MESSAGE_STATE,
};

export default reducer;

export {
  actionCreators,
  actionTypes,
  messageTypes,
  messages,
  messageLifetimeMillis,
};
