const DISMISS_MESSAGES = 'DISMISS_MESSAGES';
const SHOW_MESSAGE = 'SHOW_MESSAGE';

const messageLifetimeMillis = 3 * 1000;
const initialState = [];

const messageTypes = {
  Confirmation: Symbol('Confirmation'),
  Error: Symbol('Error'),
};

const newMessage = (text, messageType) => ({
  messageType,
  timestamp: Date.now(),
  text,
});

const recencyFilter = m => m.timestamp >= Date.now() - messageLifetimeMillis;

const reducer = (state = initialState, action = {}) => {
  switch (action.type) {
    case DISMISS_MESSAGES:
      return initialState;
    case SHOW_MESSAGE: {
      const message = {
        text: action.text,
        timestamp: action.timestamp,
        type: action.messageType,
      };
      return state
        .filter(recencyFilter)
        .filter(m => m.timestamp !== action.timestamp)
        .concat([message]);
    }
    default:
      return state;
  }
};

const dismissAppMessages = () => ({
  type: DISMISS_MESSAGES,
});

const showMessage = (text, messageType = messageTypes.Error) => ({
  type: SHOW_MESSAGE,
  ...newMessage(text, messageType),
});

const showConfirmationMessage = text => showMessage(text, messageTypes.Confirmation);

const showErrorMessage = showMessage;

const actionCreators = {
  dismissAppMessages,
  showConfirmationMessage,
  showErrorMessage,
  showMessage,
};

const actionTypes = {
  DISMISS_MESSAGES,
  SHOW_MESSAGE,
};

export default reducer;

export {
  actionCreators,
  actionTypes,
  messageTypes,
};
