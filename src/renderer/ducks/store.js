import { createStore, applyMiddleware, compose } from 'redux';
import { persistStore, autoRehydrate } from 'redux-persist';
import thunk from 'redux-thunk';
import { logger, pairingObserver } from './middleware';
import rootReducer from './modules/rootReducer';

const logReduxActions = process.env.REACT_APP_DISABLE_REDUX_LOGGER !== 'false';

const middleware = [thunk, pairingObserver];
if (logReduxActions) {
  middleware.push(logger);
}

export const store = createStore(
  rootReducer,
  undefined,
  compose(
    autoRehydrate(),
    applyMiddleware(...middleware),
    typeof window === 'object' && typeof window.devToolsExtension !== 'undefined'
      ? window.devToolsExtension()
      : f => f,
  ),
);

// TODO: remove redux-persist, or use for settings
export const persistor = persistStore(
  store,
  { whitelist: [] },
);
