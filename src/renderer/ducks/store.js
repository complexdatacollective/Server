import { createStore, applyMiddleware, compose } from 'redux';
import { persistStore, autoRehydrate } from 'redux-persist';
import thunk from 'redux-thunk';
import logger from './middleware/logger';
import rootReducer from './modules/rootReducer';

export const store = createStore(
  rootReducer,
  undefined,
  compose(
    autoRehydrate(),
    applyMiddleware(thunk, logger),
    typeof window === 'object' && typeof window.devToolsExtension !== 'undefined'
      ? window.devToolsExtension()
      : f => f,
  ),
);

// TODO: solve hydration problem with viewModelMapper if keeping persistence
export const persistor = persistStore(store, { blacklist: ['appMessages', 'protocols', 'devices'] });
