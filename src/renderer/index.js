import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { hot } from 'react-hot-loader';

// Styles must be imported before components to support css prop caching on import
import './styles/main.scss';

import { store } from './ducks/store';
import App from './containers/App';

const ConnectedApp = hot(module)(() => (
  <Provider store={store}>
    <HashRouter>
      <App />
    </HashRouter>
  </Provider>
));

ReactDOM.render(<ConnectedApp />, document.getElementById('root'));
