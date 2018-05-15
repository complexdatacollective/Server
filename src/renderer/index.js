import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';

import { Provider } from 'react-redux';

// Styles must be imported before components to support css prop caching on import
import './styles/main.scss';

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
