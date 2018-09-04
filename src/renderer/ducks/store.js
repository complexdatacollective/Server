import { createStore, applyMiddleware, compose } from 'redux';
import { persistStore, autoRehydrate } from 'redux-persist';
import thunk from 'redux-thunk';
import { logger, pairingObserver } from './middleware';
import rootReducer from './modules/rootReducer';

export const store = createStore(
  rootReducer,
  undefined,
  compose(
    autoRehydrate(),
    applyMiddleware(thunk, logger, pairingObserver),
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
