import { createStore, applyMiddleware, compose } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import thunk from 'redux-thunk';
import { logger, pairingObserver } from './middleware';
import rootReducer from './modules/rootReducer';

const persistConfig = {
  key: 'server',
  storage,
  whitelist: [
    'excludedChartVariables',
    'panelLayoutOrders',
  ],
};

export const store = createStore(
  persistReducer(persistConfig, rootReducer),
  undefined,
  compose(
    applyMiddleware(thunk, pairingObserver, logger),
    typeof window === 'object' && typeof window.devToolsExtension !== 'undefined'
      ? window.devToolsExtension()
      : f => f,
  ),
);

export const persistor = persistStore(store);
