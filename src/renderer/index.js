/* eslint-disable no-console */

import React from 'react';
import ReactDOM from 'react-dom';

import { Provider } from 'react-redux';

import { store } from './ducks/store';
import App from './containers/App';
import AppRouter from './routes';

const startApp = () => {
  ReactDOM.render(
    <Provider store={store}>
      <App>
        <AppRouter />
      </App>
    </Provider>,
    document.getElementById('root'),
  );
};

startApp();
