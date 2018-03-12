import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import logger from 'electron-log';

import { Provider } from 'react-redux';
import { ipcRenderer } from 'electron';

import { store } from './ducks/store';
import App from './containers/App';

const startApp = () => {
  ReactDOM.render(
    <Provider store={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </Provider>,
    document.getElementById('root'),
  );
};

startApp();

ipcRenderer.on('notification', (event, arg) => {
  logger.info(event, arg);
});

const checkForNotifications = () => {
  ipcRenderer.send('notification-registration');
};

checkForNotifications();
